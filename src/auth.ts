import { AuthenticationError } from './error.js'
import { SDK_VERSION } from './http.js'
import type { RequestContext } from './types/common.js'

export interface AccountContext {
  accountId: string
  shortAccountId: string
  parentAccountId: string
  clientId: string
  apiVersion: string
  businessType: string
}

interface TokenCache {
  token: string
  expiresAt: number  // Unix seconds
}

const REFRESH_BUFFER_SECONDS = 60

function parseJwt(token: string): AccountContext {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed JWT')
  const payload = parts[1]!
  // base64url → base64 → JSON
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const json = Buffer.from(base64, 'base64').toString('utf8')
  const data = JSON.parse(json) as Record<string, unknown>
  return {
    accountId: String(data['entity_id'] ?? ''),
    shortAccountId: String(data['short_entity_id'] ?? ''),
    parentAccountId: String(data['parent_entity_id'] ?? ''),
    clientId: String(data['client_id'] ?? ''),
    apiVersion: String(data['api_version'] ?? ''),
    businessType: String(data['bus_type'] ?? ''),
  }
}

export class TokenManager {
  private _cache: TokenCache | null = null
  private _refreshPromise: Promise<string> | null = null
  private _accountContext: AccountContext | null = null

  /** Exposed for testing. */
  _fetch: typeof globalThis.fetch

  constructor(
    private readonly clientId: string,
    private readonly apiKey: string,
    private readonly baseUrl: string,
    fetchImpl: typeof globalThis.fetch = globalThis.fetch
  ) {
    this._fetch = fetchImpl
  }

  get accountContext(): AccountContext | null {
    return this._accountContext
  }

  async getToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000)

    // Return cached token if still valid (with buffer)
    if (this._cache && (this._cache.expiresAt - now) > REFRESH_BUFFER_SECONDS) {
      return this._cache.token
    }

    // Deduplify concurrent refresh requests
    if (this._refreshPromise) {
      return this._refreshPromise
    }

    this._refreshPromise = this._doRefresh()
    try {
      const token = await this._refreshPromise
      return token
    } finally {
      this._refreshPromise = null
    }
  }

  /** Force token invalidation (called after 401 on any API call). */
  invalidate(): void {
    this._cache = null
  }

  private async _doRefresh(): Promise<string> {
    const res = await this._fetch(`${this.baseUrl}/v1/connect/token`, {
      method: 'POST',
      headers: {
        'x-client-id': this.clientId,
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      let message = `Token request failed with status ${res.status}`
      try {
        const body = await res.json() as Record<string, unknown>
        message = String(body['error'] ?? body['message'] ?? message)
      } catch {
        // ignore parse error
      }
      const ctx: RequestContext = {
        method: 'POST',
        path: '/v1/connect/token',
        retryCount: 0,
        timestamp: new Date().toISOString(),
      }
      throw new AuthenticationError(
        { type: 'unauthorized_error', code: 'authentication_error', message },
        res.status,
        ctx,
        { clientId: this.clientId, environment: 'unknown', sdkVersion: SDK_VERSION }
      )
    }

    const data = await res.json() as { auth_token: string; expired_at: number }
    this._cache = { token: data.auth_token, expiresAt: data.expired_at }
    this._accountContext = parseJwt(data.auth_token)
    return data.auth_token
  }
}
