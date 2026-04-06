import { normaliseApiError, NetworkError, UQPayError } from './error.js'
import { generateIdempotencyKey, validateIdempotencyKey } from './idempotency.js'
import { shouldRetry, computeDelay, parseRetryAfterMs } from './retry.js'
import type { TokenManager } from './auth.js'
import type { Logger } from './logger.js'
import type { RequestOptions, RequestContext } from './types/common.js'

export const SDK_VERSION = '0.1.0'

const TOKEN_EXPIRED_PATTERNS = [
  'token has expired',
  'login expired',
  'token expired',
  'jwt expired',
]
const IP_NOT_ALLOWED_PATTERN = 'ip not allowed'

function isTokenExpiredMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return TOKEN_EXPIRED_PATTERNS.some(p => lower.includes(p))
}

function isIpNotAllowedMessage(message: string): boolean {
  return message.toLowerCase().includes(IP_NOT_ALLOWED_PATTERN)
}

export interface InternalRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  path: string
  body?: unknown
  /** If set, send as multipart/form-data instead of JSON. Do NOT set Content-Type manually. */
  formData?: FormData
  /** Override the client base URL (e.g. for the file service). */
  baseUrl?: string
  /** If true, this is the token endpoint itself — skip auth injection + token retry. */
  isAuthEndpoint?: boolean
}

export class HttpClient {
  private _appInfo: string | null = null

  constructor(
    private readonly baseUrl: string,
    private readonly tokenManager: TokenManager,
    private readonly logger: Logger,
    private readonly clientId: string,
    private readonly sdkVersion: string,
    private readonly defaultTimeout: number,
    private readonly _fetch: typeof globalThis.fetch = globalThis.fetch,
    private readonly defaultMaxRetries: number = 2
  ) {}

  /** Set partner app info appended to User-Agent (called by UQPayClient.setAppInfo). */
  setAppInfo(name: string, version: string, url?: string): void {
    this._appInfo = url ? `${name}/${version} (${url})` : `${name}/${version}`
  }

  async request<T = unknown>(
    opts: InternalRequestOptions,
    reqOptions: RequestOptions = {},
    retryCount = 0,
    tokenRefreshed = false
  ): Promise<T> {
    const timestamp = new Date().toISOString()

    // Build idempotency key — sent on all requests
    const override = reqOptions.headers?.['x-idempotency-key']
    if (override) validateIdempotencyKey(override)
    const idempotencyKey = override ?? generateIdempotencyKey()

    const onBehalfOf = reqOptions.headers?.['x-on-behalf-of']

    const ctx: RequestContext = {
      method: opts.method,
      path: opts.path,
      idempotencyKey,
      ...(onBehalfOf !== undefined && { onBehalfOf }),
      retryCount,
      timestamp,
    }

    const diagBase = {
      clientId: this.clientId,
      environment: this.baseUrl.includes('sandbox') ? 'sandbox' : 'production',
      sdkVersion: this.sdkVersion,
    }
    const accountId = this.tokenManager.accountContext?.accountId
    const shortAccountId = this.tokenManager.accountContext?.shortAccountId
    const diag = {
      ...diagBase,
      ...(accountId !== undefined && { accountId }),
      ...(shortAccountId !== undefined && { shortAccountId }),
    }

    // Build headers
    const userAgent = this._appInfo
      ? `uqpay-node/${this.sdkVersion} node/${process.version} ${this._appInfo}`
      : `uqpay-node/${this.sdkVersion} node/${process.version}`

    // Build headers — Content-Type is NOT set when formData is provided (fetch sets multipart boundary)
    const headers: Record<string, string> = {
      ...(opts.formData ? {} : { 'Content-Type': 'application/json' }),
      'User-Agent': userAgent,
      ...reqOptions.headers,
    }

    if (!opts.isAuthEndpoint) {
      const token = await this.tokenManager.getToken()
      headers['x-auth-token'] = `Bearer ${token}`
    }

    headers['x-idempotency-key'] = idempotencyKey

    const timeout = reqOptions.timeout ?? this.defaultTimeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    const url = `${opts.baseUrl ?? this.baseUrl}${opts.path}`
    const start = Date.now()

    let res: Response | undefined
    let rawStatus = 0

    try {
      const fetchInit: RequestInit = {
        method: opts.method,
        headers,
        signal: controller.signal,
        body: opts.formData ?? (opts.body !== undefined ? JSON.stringify(opts.body) : null),
      }
      res = await this._fetch(url, fetchInit)

      rawStatus = res.status
      const durationMs = Date.now() - start

      // Parse response
      const contentType = res.headers.get('content-type') ?? ''
      let responseBody: unknown
      if (contentType.includes('application/json')) {
        try {
          responseBody = await res.json()
        } catch {
          const text = await res.text()
          responseBody = text
        }
      } else {
        const text = await res.text()
        // Try to parse as JSON even when content-type is missing/incorrect
        try {
          responseBody = JSON.parse(text)
        } catch {
          responseBody = text
        }
      }

      // Log
      this.logger.debug(
        opts.method, opts.path, rawStatus, durationMs,
        idempotencyKey ?? '-',
        this.tokenManager.accountContext?.shortAccountId,
        retryCount,
        opts.body,
        responseBody,
        onBehalfOf
      )

      if (res.ok) {
        return responseBody as T
      }

      // Error path
      const err = normaliseApiError(responseBody, rawStatus, ctx, diag)

      // Special 401 handling (only on non-auth endpoints, only retry once)
      if (rawStatus === 401 && !opts.isAuthEndpoint && !tokenRefreshed) {
        const msg = err.message.toLowerCase()
        if (isTokenExpiredMessage(msg)) {
          this.tokenManager.invalidate()
          return this.request<T>(opts, reqOptions, retryCount, true)
        }
        // All other 401s (IP not allowed, revoked key, unknown) — throw immediately, don't retry
        throw err
      }

      // Auto-retry for transient errors
      const maxRetries = reqOptions.maxRetries ?? this.defaultMaxRetries
      if (!opts.isAuthEndpoint && shouldRetry(err, retryCount, maxRetries)) {
        const retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'))
        const delay = computeDelay(retryCount, retryAfterMs)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.request<T>(opts, reqOptions, retryCount + 1, tokenRefreshed)
      }

      throw err
    } catch (e) {
      if (e instanceof UQPayError) {
        throw e
      }
      if (e instanceof Error && e.name === 'AbortError') {
        throw new NetworkError(`Request timed out after ${timeout}ms`, ctx, diag)
      }
      if (e instanceof Error) {
        throw new NetworkError(e.message, ctx, diag)
      }
      throw e
    } finally {
      clearTimeout(timer)
    }
  }
}
