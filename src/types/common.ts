// ─── Environments ─────────────────────────────────────────────────────────────

export type Environment = 'sandbox' | 'production'

export const BASE_URLS: Record<Environment, string> = {
  sandbox: 'https://api-sandbox.uqpaytech.com/api',
  production: 'https://api.uqpay.com/api',
}

export const FILE_BASE_URLS: Record<Environment, string> = {
  sandbox: 'https://files.uqpaytech.com/api',
  production: 'https://files.uqpay.com/api',
}

export const IFRAME_BASE_URLS: Record<Environment, string> = {
  sandbox: 'https://embedded-sandbox.uqpaytech.com',
  production: 'https://embedded.uqpay.com',
}

// ─── Log Levels ───────────────────────────────────────────────────────────────

export type LogLevel = 'none' | 'info' | 'debug'

// ─── Error Types ──────────────────────────────────────────────────────────────

export type ErrorType =
  | 'invalid_request_error'
  | 'unauthorized_error'
  | 'forbidden'
  | 'not_found'
  | 'not_allowed'
  | 'api_error'
  | 'idempotency_error'
  | 'conflict_error'
  | 'account_error'
  | 'card_error'
  | 'cardholder_error'
  | 'payment_error'
  | 'product_error'
  | 'transfer_error'
  | 'payout_error'
  | 'rate_limit_error'

// ─── Webhook Event Types ──────────────────────────────────────────────────────

export type WebhookEventType =
  | 'ISSUING'
  | 'ACQUIRING'
  | 'DEPOSIT'
  | 'PAYOUT'
  | 'BENEFICIARY'
  | 'CONVERSION'
  | 'VIRTUAL'
  | 'RFI'
  | 'ONBOARDING'

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  total_pages: number
  total_items: number
  data: T[]
}

export interface PaginationParams {
  page_number?: number
  page_size?: number
}

// ─── Request Options ─────────────────────────────────────────────────────────

export interface RequestOptions {
  /** Override individual headers (e.g. x-on-behalf-of, x-idempotency-key). */
  headers?: Record<string, string>
  /** Per-request timeout in ms. Overrides the global client timeout. */
  timeout?: number
  /** Per-request max retry count. Overrides the global client setting. */
  maxRetries?: number
}

// ─── Client Config ────────────────────────────────────────────────────────────

export interface UQPayClientConfig {
  clientId: string
  apiKey: string
  environment?: Environment
  /** Webhook secret for signature verification. */
  webhookSecret?: string
  /** Request timeout in ms. Default: 30_000. */
  timeout?: number
  /** Number of automatic retries. Default: 2. */
  maxRetries?: number
  /** Log level. Default: 'none'. */
  logLevel?: LogLevel
  /** Additional fields to redact from logs (beyond the built-in list). */
  redactFields?: string[]
}

// ─── Internal Request Context ─────────────────────────────────────────────────

export interface RequestContext {
  method: string
  path: string
  idempotencyKey?: string
  onBehalfOf?: string
  retryCount: number
  timestamp: string
}
