import { describe, it, expect, vi } from 'vitest'
import { HttpClient } from '../src/http.js'
import { AuthenticationError, NetworkError, NotFoundError, ServerError, ValidationError } from '../src/error.js'
import { Logger } from '../src/logger.js'
import { TokenManager } from '../src/auth.js'

const FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  Buffer.from(JSON.stringify({
    entity_id: 'acc-1', short_entity_id: 'CB001', parent_entity_id: '0',
    client_id: 'cid1', api_version: 'V1.0', bus_type: 'ACQUIRING', exp: 9999999999,
  })).toString('base64url'),
  'sig',
].join('.')

function makeTokenManager(fetchImpl: typeof globalThis.fetch) {
  return new TokenManager('cid', 'key', 'https://api.example.com', fetchImpl)
}

function makeTokenFetch(token = FAKE_JWT) {
  return vi.fn().mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ auth_token: token, expired_at: 9999999999 }),
    text: async () => JSON.stringify({ auth_token: token, expired_at: 9999999999 }),
  })
}

function makeApiFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    headers: { get: () => null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
}

describe('HttpClient', () => {
  it('injects x-auth-token on each request', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(200, { id: '1' })

    const client = new HttpClient(
      'https://api.example.com',
      tm,
      new Logger('none'),
      'cid1',
      '0.1.0',
      30_000,
      apiFetch as typeof globalThis.fetch
    )

    await client.request({ method: 'GET', path: '/v1/accounts' })

    const callHeaders = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(callHeaders?.['x-auth-token']).toBe(`Bearer ${FAKE_JWT}`)
  })

  it('injects x-idempotency-key on GET', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(200, { data: [] })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await client.request({ method: 'GET', path: '/v1/accounts' })

    const callHeaders = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(callHeaders?.['x-idempotency-key']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('injects x-idempotency-key on POST', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(201, { id: '1' })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await client.request({ method: 'POST', path: '/v1/accounts', body: {} })

    const callHeaders = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(callHeaders?.['x-idempotency-key']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('throws ValidationError on 400', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(400, { type: 'invalid_request_error', code: 'invalid_parameter', message: 'bad' })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await expect(client.request({ method: 'GET', path: '/v1/accounts' })).rejects.toBeInstanceOf(ValidationError)
  })

  it('throws NotFoundError on 404', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(404, { type: 'not_found', code: 'not_found', message: 'missing' })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await expect(client.request({ method: 'GET', path: '/v1/accounts/bad' })).rejects.toBeInstanceOf(NotFoundError)
  })

  it('auto-refreshes token on 401 and retries once', async () => {
    let callCount = 0
    const tokenFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ auth_token: FAKE_JWT, expired_at: 9999999999 }),
    })
    const tm = makeTokenManager(tokenFetch)
    // Prime the cache
    await tm.getToken()

    const apiFetch = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          ok: false, status: 401,
          headers: { get: () => null },
          json: async () => ({ error: 'token has expired' }),
          text: async () => '{"error": "token has expired"}',
        })
      }
      return Promise.resolve({
        ok: true, status: 200,
        headers: { get: () => null },
        json: async () => ({ id: 'retried' }),
        text: async () => '{"id": "retried"}',
      })
    })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    const result = await client.request({ method: 'GET', path: '/v1/accounts' })
    expect(result).toEqual({ id: 'retried' })
    expect(apiFetch).toHaveBeenCalledTimes(2)
    expect(tokenFetch).toHaveBeenCalledTimes(2)  // initial + refresh after 401
  })

  it('does NOT retry on IP whitelist 401', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(401, { error: 'ip not allowed' })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await expect(client.request({ method: 'GET', path: '/v1/accounts' })).rejects.toBeInstanceOf(AuthenticationError)
    expect(apiFetch).toHaveBeenCalledOnce()
  })

  it('passes x-on-behalf-of from RequestOptions', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(200, { data: [] })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await client.request(
      { method: 'GET', path: '/v1/accounts' },
      { headers: { 'x-on-behalf-of': 'sub-acct-id' } }
    )
    const callHeaders = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(callHeaders?.['x-on-behalf-of']).toBe('sub-acct-id')
  })

  it('injects x-idempotency-key on PUT', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(200, { id: '1' })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await client.request({ method: 'PUT', path: '/v1/accounts/1', body: {} })

    const callHeaders = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(callHeaders?.['x-idempotency-key']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('injects x-idempotency-key on PATCH', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(200, { id: '1' })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await client.request({ method: 'PATCH', path: '/v1/accounts/1', body: {} })

    const callHeaders = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(callHeaders?.['x-idempotency-key']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('includes setAppInfo string in User-Agent', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(200, { id: '1' })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    client.setAppInfo('MyApp', '1.0', 'https://myapp.com')
    await client.request({ method: 'GET', path: '/v1/accounts' })

    const callHeaders = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(callHeaders?.['User-Agent']).toContain('MyApp/1.0 (https://myapp.com)')
  })

  it('rejects with NetworkError when fetch hangs and timeout elapses', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)

    // A fetch that respects the AbortSignal and rejects when it fires
    const hangingFetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise<never>((_resolve, reject) => {
        const signal = init?.signal
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new DOMException('The operation was aborted.', 'AbortError')
            reject(err)
          })
        }
      })
    })

    const client = new HttpClient(
      'https://api.example.com',
      tm,
      new Logger('none'),
      'cid1',
      '0.1.0',
      1, // 1ms timeout — AbortController fires almost immediately
      hangingFetch as unknown as typeof globalThis.fetch
    )

    await expect(client.request({ method: 'GET', path: '/v1/accounts' })).rejects.toBeInstanceOf(NetworkError)
  })

  it('resolves with raw text when response has no application/json content-type', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const plainTextFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (h: string) => h === 'content-type' ? 'text/plain' : null },
      json: async () => { throw new Error('should not call json()') },
      text: async () => 'OK',
    })

    const client = new HttpClient(
      'https://api.example.com',
      tm,
      new Logger('none'),
      'cid1',
      '0.1.0',
      30_000,
      plainTextFetch as unknown as typeof globalThis.fetch
    )

    const result = await client.request({ method: 'GET', path: '/v1/ping' })
    expect(result).toBe('OK')
  })

  it('throws AuthenticationError on 401 with unrecognised message', async () => {
    const tokenFetch = makeTokenFetch()
    const tm = makeTokenManager(tokenFetch)
    const apiFetch = makeApiFetch(401, { error: 'some unknown auth error' })

    const client = new HttpClient('https://api.example.com', tm, new Logger('none'), 'cid1', '0.1.0', 30_000, apiFetch as typeof globalThis.fetch)
    await expect(client.request({ method: 'GET', path: '/v1/accounts' })).rejects.toBeInstanceOf(AuthenticationError)
    expect(apiFetch).toHaveBeenCalledOnce()  // no retry
  })
})
