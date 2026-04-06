import { describe, it, expect, vi } from 'vitest'
import { TokenManager } from '../src/auth.js'

// A minimal JWT with known payload
const FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  Buffer.from(JSON.stringify({
    entity_id: 'acc-123',
    short_entity_id: 'CB89049',
    parent_entity_id: '0',
    client_id: 'cid1',
    api_version: 'V1.0',
    bus_type: 'BANKING',
    exp: 9999999999,
  })).toString('base64url'),
  'sig',
].join('.')

function mockFetch(token = FAKE_JWT, expiredAt = Math.floor(Date.now() / 1000) + 1800) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ auth_token: token, expired_at: expiredAt }),
  })
}

describe('TokenManager', () => {
  it('fetches token on first call', async () => {
    const fetch = mockFetch()
    const tm = new TokenManager('cid', 'key', 'https://api.example.com', fetch as typeof globalThis.fetch)
    const token = await tm.getToken()
    expect(token).toBe(FAKE_JWT)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('returns cached token on second call', async () => {
    const fetch = mockFetch()
    const tm = new TokenManager('cid', 'key', 'https://api.example.com', fetch as typeof globalThis.fetch)
    await tm.getToken()
    await tm.getToken()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('deduplifies concurrent refresh requests', async () => {
    const fetch = mockFetch()
    const tm = new TokenManager('cid', 'key', 'https://api.example.com', fetch as typeof globalThis.fetch)
    await Promise.all([tm.getToken(), tm.getToken(), tm.getToken()])
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('parses JWT payload and exposes account context', async () => {
    const fetch = mockFetch()
    const tm = new TokenManager('cid', 'key', 'https://api.example.com', fetch as typeof globalThis.fetch)
    await tm.getToken()
    expect(tm.accountContext).toMatchObject({
      accountId: 'acc-123',
      shortAccountId: 'CB89049',
      parentAccountId: '0',
      clientId: 'cid1',
      apiVersion: 'V1.0',
      businessType: 'BANKING',
    })
  })

  it('refreshes when token is within 60s of expiry', async () => {
    const expiringSoon = Math.floor(Date.now() / 1000) + 30  // 30s left
    const fetch = mockFetch(FAKE_JWT, expiringSoon)
    const tm = new TokenManager('cid', 'key', 'https://api.example.com', fetch as typeof globalThis.fetch)
    await tm.getToken()           // First fetch
    const second = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ auth_token: FAKE_JWT, expired_at: 9999999999 }),
    })
    tm['_fetch'] = second as typeof globalThis.fetch
    await tm.getToken()           // Should re-fetch because token expires in 30s < 60s buffer
    expect(second).toHaveBeenCalledOnce()
  })

  it('throws AuthenticationError when token endpoint returns 401', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error": "Invalid API key"}',
      json: async () => ({ error: 'Invalid API key' }),
    })
    const tm = new TokenManager('cid', 'key', 'https://api.example.com', fetch as typeof globalThis.fetch)
    await expect(tm.getToken()).rejects.toThrow('Invalid API key')
  })
})
