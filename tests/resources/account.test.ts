import { describe, it, expect, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { AccountResource } from '../../src/resources/account/index.js'

const FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  Buffer.from(JSON.stringify({ entity_id: 'a1', short_entity_id: 'CB001', parent_entity_id: '0', client_id: 'c1', api_version: 'V1.0', bus_type: 'BANKING', exp: 9999999999 })).toString('base64url'),
  'sig',
].join('.')

function makeClient(apiFetch: typeof globalThis.fetch) {
  const tokenFetch = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ auth_token: FAKE_JWT, expired_at: 9999999999 }),
  })
  const tm = new TokenManager('cid', 'key', 'https://api.example.com', tokenFetch)
  const http = new HttpClient('https://api.example.com', tm, new Logger('none'), 'c1', '0.1.0', 30_000, apiFetch)
  return new AccountResource(http)
}

describe('AccountResource', () => {
  describe('accounts.retrieve', () => {
    it('calls GET /v1/accounts/{id}', async () => {
      const apiFetch = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ account_id: 'acc-1', status: 'ACTIVE' }),
        text: async () => '{}',
      })
      const resource = makeClient(apiFetch)
      const result = await resource.accounts.retrieve('acc-1')
      expect(result.account_id).toBe('acc-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/accounts/acc-1')
    })
  })

  describe('accounts.list', () => {
    it('calls GET /v1/accounts with pagination params', async () => {
      const apiFetch = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ total_pages: 1, total_items: 1, data: [] }),
        text: async () => '{}',
      })
      const resource = makeClient(apiFetch)
      await resource.accounts.list({ page_number: 1, page_size: 10 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/accounts')
    })
  })

  describe('subAccounts.create', () => {
    it('calls POST /v1/accounts/create_accounts', async () => {
      const apiFetch = vi.fn().mockResolvedValue({
        ok: true, status: 201,
        headers: { get: () => 'application/json' },
        json: async () => ({ account_id: 'new-1', status: 'PENDING' }),
        text: async () => '{}',
      })
      const resource = makeClient(apiFetch)
      const result = await resource.subAccounts.create({
        business_type: 'BANKING',
        entity_type: 'COMPANY',
        nickname: 'Test Co',
      } as any)
      expect(result.account_id).toBe('new-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/accounts/create_accounts')
    })
  })

  describe('additionalDocs.get', () => {
    it('calls GET /v1/accounts/get_additional', async () => {
      const apiFetch = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ([{ profile_key: 'business_articles_of_association', profile_name: 'Articles of Association', profile_option: 1 }]),
        text: async () => '[]',
      })
      const resource = makeClient(apiFetch)
      await resource.additionalDocs.get({ country: 'SG', business_code: 'BANKING' })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/accounts/get_additional')
      expect(url).toContain('country=SG')
    })
  })
})
