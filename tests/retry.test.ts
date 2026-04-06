import { describe, it, expect, vi } from 'vitest'
import { shouldRetry, computeDelay, parseRetryAfterMs } from '../src/retry.js'
import { ServerError, NetworkError, RateLimitError, ValidationError } from '../src/error.js'
import type { RequestContext } from '../src/types/common.js'

const ctx: RequestContext = { method: 'GET', path: '/v1/test', retryCount: 0, timestamp: '' }
const diag = { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
const body = { type: 'api_error', code: 'server_error', message: 'err' }

describe('shouldRetry', () => {
  it('retries on ServerError (5xx)', () => {
    const err = new ServerError(body, 500, ctx, diag)
    expect(shouldRetry(err, 0, 2)).toBe(true)
  })

  it('retries on RateLimitError (429)', () => {
    const err = new RateLimitError({ type: 'rate_limit_error', code: 'too_many_requests', message: 'slow down' }, 429, ctx, diag)
    expect(shouldRetry(err, 0, 2)).toBe(true)
  })

  it('retries NetworkError', () => {
    const err = new NetworkError('connection reset', ctx, diag)
    expect(shouldRetry(err, 0, 2)).toBe(true)
  })

  it('does not retry ValidationError (400)', () => {
    const err = new ValidationError({ type: 'invalid_request_error', code: 'invalid_parameter', message: 'bad' }, 400, ctx, diag)
    expect(shouldRetry(err, 0, 2)).toBe(false)
  })

  it('stops retrying when attempt >= maxRetries', () => {
    const err = new ServerError(body, 500, ctx, diag)
    expect(shouldRetry(err, 2, 2)).toBe(false)
    expect(shouldRetry(err, 3, 2)).toBe(false)
  })

  it('retries "Request is processing" 400 error', () => {
    const err = new ValidationError(
      { type: 'invalid_request_error', code: '200', message: 'Request is processing, please try again later' },
      400, ctx, diag
    )
    expect(shouldRetry(err, 0, 2)).toBe(true)
  })
})

describe('computeDelay', () => {
  it('returns values within expected range for attempt 0', () => {
    // base=500, attempt 0 → min=500, max=500+1000=1500
    for (let i = 0; i < 20; i++) {
      const d = computeDelay(0)
      expect(d).toBeGreaterThanOrEqual(500)
      expect(d).toBeLessThanOrEqual(1500)
    }
  })

  it('caps at maxDelay', () => {
    const d = computeDelay(20)  // 2^20 * 500 is huge
    expect(d).toBeLessThanOrEqual(30_000 + 1000)  // maxDelay + jitter
  })

  it('increases with attempt number', () => {
    // The base delay (without jitter) should increase
    // Strip jitter by computing multiple times and checking minimum
    const min0 = Math.min(...Array.from({ length: 50 }, () => computeDelay(0)))
    const min2 = Math.min(...Array.from({ length: 50 }, () => computeDelay(2)))
    expect(min2).toBeGreaterThan(min0)
  })

  it('returns retryAfterMs exactly when provided and > 0', () => {
    expect(computeDelay(0, 5000)).toBe(5000)
    expect(computeDelay(3, 12345)).toBe(12345)
  })
})

describe('parseRetryAfterMs', () => {
  it('returns undefined for null input', () => {
    expect(parseRetryAfterMs(null)).toBeUndefined()
  })

  it('parses seconds integer correctly', () => {
    expect(parseRetryAfterMs('30')).toBe(30_000)
  })

  it('parses HTTP-date string and returns positive ms for a future date', () => {
    // Use a date far in the future so the result is always > 0
    const futureDate = new Date(Date.now() + 60_000).toUTCString()
    const result = parseRetryAfterMs(futureDate)
    expect(result).toBeDefined()
    expect(result!).toBeGreaterThan(0)
  })

  it('returns undefined for an unparseable string', () => {
    expect(parseRetryAfterMs('not-a-date-or-number')).toBeUndefined()
  })
})
