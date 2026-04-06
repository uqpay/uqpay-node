import { UQPayError, NetworkError, RateLimitError, ServerError } from './error.js'

const BASE_DELAY_MS = 500
const MAX_DELAY_MS = 30_000
const JITTER_MS = 1_000

const PROCESSING_PATTERN = 'request is processing'

/** True if the error is transient and the request should be retried. */
export function shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false

  if (error instanceof NetworkError) return true
  if (error instanceof RateLimitError) return true
  if (error instanceof ServerError) return true

  if (error instanceof UQPayError) {
    if (error.httpStatus === 408) return true
    // "Request is processing" quirk from Identity Gateway
    if (error.message.toLowerCase().includes(PROCESSING_PATTERN)) return true
  }

  return false
}

/** Exponential backoff with random jitter. Returns delay in ms. */
export function computeDelay(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs !== undefined) return retryAfterMs
  const base = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS)
  const jitter = Math.random() * JITTER_MS
  return Math.floor(base + jitter)
}

/** Parse Retry-After header (seconds integer or HTTP-date) into milliseconds. */
export function parseRetryAfterMs(retryAfter: string | null): number | undefined {
  if (!retryAfter) return undefined
  const seconds = parseInt(retryAfter, 10)
  if (!isNaN(seconds)) return seconds * 1000
  const date = Date.parse(retryAfter)
  if (!isNaN(date)) return Math.max(0, date - Date.now())
  return undefined
}
