import type { RequestContext } from './types/common.js'

// ─── Diagnostic context supplied by HttpClient ────────────────────────────────

export interface DiagnosticContext {
  clientId: string
  environment: string
  sdkVersion: string
  accountId?: string
  shortAccountId?: string
}

// ─── Normalised API error body ────────────────────────────────────────────────

interface NormalisedBody {
  type: string
  code: string
  message: string
}

// ─── Base class ───────────────────────────────────────────────────────────────

export class UQPayError extends Error {
  readonly type: string
  readonly code: string
  readonly httpStatus: number
  readonly idempotencyKey: string | undefined
  readonly timestamp: string
  readonly method: string
  readonly path: string
  readonly environment: string
  readonly accountId: string | undefined
  readonly shortAccountId: string | undefined
  readonly clientId: string
  readonly onBehalfOf: string | undefined
  readonly sdkVersion: string
  readonly retryCount: number

  constructor(
    body: NormalisedBody,
    httpStatus: number,
    ctx: RequestContext,
    diag: DiagnosticContext
  ) {
    super(body.message)
    this.name = new.target.name
    this.type = body.type
    this.code = body.code
    this.httpStatus = httpStatus
    this.idempotencyKey = ctx.idempotencyKey
    this.timestamp = ctx.timestamp
    this.method = ctx.method
    this.path = ctx.path
    this.environment = diag.environment
    this.accountId = diag.accountId
    this.shortAccountId = diag.shortAccountId
    this.clientId = diag.clientId
    this.onBehalfOf = ctx.onBehalfOf
    this.sdkVersion = diag.sdkVersion
    this.retryCount = ctx.retryCount
  }
}

// ─── Subclasses ───────────────────────────────────────────────────────────────

export class AuthenticationError extends UQPayError {}
export class ValidationError extends UQPayError {}
export class ForbiddenError extends UQPayError {}
export class NotFoundError extends UQPayError {}
export class RateLimitError extends UQPayError {}
export class ConflictError extends UQPayError {}
export class IdempotencyError extends UQPayError {}
export class ServerError extends UQPayError {}

export class NetworkError extends Error {
  readonly method: string
  readonly path: string
  readonly environment: string
  readonly clientId: string
  readonly sdkVersion: string
  readonly retryCount: number

  constructor(message: string, ctx: RequestContext, diag: DiagnosticContext) {
    super(message)
    this.name = 'NetworkError'
    this.method = ctx.method
    this.path = ctx.path
    this.environment = diag.environment
    this.clientId = diag.clientId
    this.sdkVersion = diag.sdkVersion
    this.retryCount = ctx.retryCount
  }
}

export class UQPayWebhookError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UQPayWebhookError'
  }
}

export class SimulatorNotAvailableError extends Error {
  constructor() {
    super('The simulator is only available in sandbox mode.')
    this.name = 'SimulatorNotAvailableError'
  }
}

export class InvalidIdempotencyKeyError extends Error {
  constructor(key: string) {
    super(
      `Idempotency key "${key}" is not a valid UUID v4. ` +
      `Generate one with crypto.randomUUID() or the generateIdempotencyKey() helper.`
    )
    this.name = 'InvalidIdempotencyKeyError'
  }
}

// ─── HTTP status → inferred error type ────────────────────────────────────────

function inferType(status: number): string {
  if (status === 401) return 'unauthorized_error'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict_error'
  if (status === 429) return 'rate_limit_error'
  if (status >= 500) return 'api_error'
  return 'invalid_request_error'
}

// ─── Parse raw API response body into NormalisedBody ─────────────────────────

function parseBody(raw: unknown, status: number): NormalisedBody {
  // Non-JSON or non-object
  if (typeof raw === 'string') {
    return {
      type: inferType(status),
      code: String(status),
      message: raw.slice(0, 200),
    }
  }

  if (typeof raw !== 'object' || raw === null) {
    return { type: inferType(status), code: String(status), message: 'Unknown error' }
  }

  const obj = raw as Record<string, unknown>

  // Auth middleware format: { error: "..." } — only on 401
  if (status === 401 && typeof obj['error'] === 'string') {
    return {
      type: 'unauthorized_error',
      code: 'authentication_error',
      message: obj['error'],
    }
  }

  // Modern format: { type, code, message }
  if (typeof obj['type'] === 'string' && typeof obj['message'] === 'string') {
    return {
      type: obj['type'],
      code: typeof obj['code'] === 'string' ? obj['code'] : String(obj['code'] ?? ''),
      message: obj['message'],
    }
  }

  // Legacy format: { code: number, message: string }
  // NOTE: Identity Gateway quirk — body.code may be 200 even on HTTP 400. Always trust HTTP status.
  if (typeof obj['message'] === 'string') {
    return {
      type: inferType(status),
      code: String(obj['code'] ?? status),
      message: obj['message'],
    }
  }

  return { type: inferType(status), code: String(status), message: JSON.stringify(raw).slice(0, 200) }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function normaliseApiError(
  raw: unknown,
  status: number,
  ctx: RequestContext,
  diag: DiagnosticContext
): UQPayError {
  const body = parseBody(raw, status)

  if (status === 401) return new AuthenticationError(body, status, ctx, diag)
  if (status === 403) return new ForbiddenError(body, status, ctx, diag)
  if (status === 404) return new NotFoundError(body, status, ctx, diag)
  if (status === 409) return new ConflictError(body, status, ctx, diag)
  if (status === 429) return new RateLimitError(body, status, ctx, diag)
  if (status >= 500) return new ServerError(body, status, ctx, diag)

  // 400: check for idempotency sub-type
  if (body.type === 'idempotency_error') {
    return new IdempotencyError(body, status, ctx, diag)
  }

  return new ValidationError(body, status, ctx, diag)
}
