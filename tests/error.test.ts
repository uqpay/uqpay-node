import { describe, it, expect } from 'vitest'
import {
  UQPayError,
  AuthenticationError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ServerError,
  NetworkError,
  ConflictError,
  IdempotencyError,
  UQPayWebhookError,
  normaliseApiError,
} from '../src/error.js'
import type { RequestContext } from '../src/types/common.js'

const ctx: RequestContext = {
  method: 'POST',
  path: '/api/v1/accounts',
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
  retryCount: 0,
  timestamp: '2026-04-02T00:00:00.000Z',
}

describe('UQPayError', () => {
  it('carries all diagnostic fields', () => {
    const err = new ValidationError(
      { type: 'invalid_request_error', code: 'invalid_parameter', message: 'bad param' },
      400,
      ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err.httpStatus).toBe(400)
    expect(err.type).toBe('invalid_request_error')
    expect(err.code).toBe('invalid_parameter')
    expect(err.message).toBe('bad param')
    expect(err.method).toBe('POST')
    expect(err.path).toBe('/api/v1/accounts')
    expect(err.idempotencyKey).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(err.retryCount).toBe(0)
    expect(err instanceof UQPayError).toBe(true)
    expect(err instanceof ValidationError).toBe(true)
  })

  it('normalises modern error format', () => {
    const err = normaliseApiError(
      { type: 'card_error', code: 'invalid_number', message: 'Bad card' },
      400, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err.type).toBe('card_error')
    expect(err.code).toBe('invalid_number')
    expect(err instanceof ValidationError).toBe(true)
  })

  it('normalises legacy error format (numeric code)', () => {
    const err = normaliseApiError(
      { code: 400, message: 'Something went wrong' },
      400, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err.type).toBe('invalid_request_error')
    expect(err.code).toBe('400')
  })

  it('normalises auth middleware error format', () => {
    const err = normaliseApiError(
      { error: 'Invalid authorization header' },
      401, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err.type).toBe('unauthorized_error')
    expect(err.message).toBe('Invalid authorization header')
    expect(err instanceof AuthenticationError).toBe(true)
  })

  it('normalises non-JSON body', () => {
    const err = normaliseApiError(
      '<html>Bad Gateway</html>',
      502, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err.type).toBe('api_error')
    expect(err.message).toContain('<html>')
    expect(err instanceof ServerError).toBe(true)
  })

  it('returns RateLimitError for 429', () => {
    const err = normaliseApiError(
      { code: 429, message: 'Too many requests' },
      429, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err instanceof RateLimitError).toBe(true)
  })

  it('returns ConflictError for 409', () => {
    const err = normaliseApiError(
      { type: 'idempotency_error', code: 'key_conflict', message: 'conflict' },
      409, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err instanceof ConflictError).toBe(true)
  })

  it('returns ServerError for 5xx', () => {
    const err = normaliseApiError(
      { type: 'api_error', code: 'server_error', message: 'Internal error' },
      500, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err instanceof ServerError).toBe(true)
  })

  it('ignores body code=200 when HTTP status is 400 (Identity Gateway quirk)', () => {
    const err = normaliseApiError(
      { code: 200, message: 'Request is processing, please try again later' },
      400, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err.httpStatus).toBe(400)
    expect(err instanceof ValidationError).toBe(true)
  })

  it('returns ForbiddenError for 403', () => {
    const err = normaliseApiError(
      { type: 'forbidden', code: 'forbidden', message: 'Access denied' },
      403, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err instanceof ForbiddenError).toBe(true)
    expect(err.httpStatus).toBe(403)
  })

  it('returns NotFoundError for 404', () => {
    const err = normaliseApiError(
      { type: 'not_found', code: 'not_found', message: 'Resource not found' },
      404, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err instanceof NotFoundError).toBe(true)
    expect(err.httpStatus).toBe(404)
  })

  it('sets err.name to the subclass name', () => {
    const err = new AuthenticationError(
      { type: 'unauthorized_error', code: 'authentication_error', message: 'bad token' },
      401, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err.name).toBe('AuthenticationError')
  })

  it('409 ConflictError has type from body', () => {
    const err = normaliseApiError(
      { type: 'idempotency_error', code: 'key_conflict', message: 'conflict' },
      409, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err instanceof ConflictError).toBe(true)
    expect(err.type).toBe('idempotency_error')  // body.type wins (modern format)
  })

  it('409 ConflictError without body type uses conflict_error', () => {
    const err = normaliseApiError(
      { code: 409, message: 'Conflict occurred' },  // legacy format, no type field
      409, ctx,
      { clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0' }
    )
    expect(err instanceof ConflictError).toBe(true)
    expect(err.type).toBe('conflict_error')  // from inferType
  })

  it('NetworkError carries diagnostic fields', () => {
    const networkErr = new NetworkError('connection reset', ctx, {
      clientId: 'c1', environment: 'sandbox', sdkVersion: '0.1.0'
    })
    expect(networkErr.method).toBe('POST')
    expect(networkErr.path).toBe('/api/v1/accounts')
    expect(networkErr.retryCount).toBe(0)
    expect(networkErr instanceof UQPayError).toBe(false)
  })
})
