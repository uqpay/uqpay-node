import { describe, it, expect, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { BankingResource } from '../../src/resources/banking/index.js'

const FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  Buffer.from(JSON.stringify({ entity_id: 'a1', short_entity_id: 'CB001', parent_entity_id: '0', client_id: 'c1', api_version: 'V1.0', bus_type: 'BANKING', exp: 9999999999 })).toString('base64url'),
  'sig',
].join('.')

function makeResource(apiFetch: typeof globalThis.fetch) {
  const tokenFetch = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ auth_token: FAKE_JWT, expired_at: 9999999999 }),
  })
  const tm = new TokenManager('cid', 'key', 'https://api.example.com', tokenFetch)
  const http = new HttpClient('https://api.example.com', tm, new Logger('none'), 'c1', '0.1.0', 30_000, apiFetch)
  return new BankingResource(http)
}

function mockJson(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400, status,
    headers: { get: (h: string) => h === 'content-type' ? 'application/json' : null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
}

describe('BankingResource', () => {
  describe('balances.list', () => {
    it('calls GET /v1/balances with page params', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 1, data: [] })
      const resource = makeResource(apiFetch)
      await resource.balances.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/balances')
      expect(url).toContain('page_size=10')
    })
  })

  describe('balances.retrieve', () => {
    it('calls GET /v1/balances/{currency}', async () => {
      const apiFetch = mockJson({ balance_id: 'b-1', currency: 'USD', available_balance: 1000 })
      const resource = makeResource(apiFetch)
      const result = await resource.balances.retrieve('USD')
      expect(result.currency).toBe('USD')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/balances/USD')
    })
  })

  describe('balances.listTransactions', () => {
    it('calls GET /v1/balances/transactions', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.balances.listTransactions({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/balances/transactions')
    })
  })

  describe('deposits.list', () => {
    it('calls GET /v1/deposit', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.deposits.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/deposit')
    })
  })

  describe('deposits.retrieve', () => {
    it('calls GET /v1/deposit/{id}', async () => {
      const apiFetch = mockJson({ deposit_id: 'd-1', status: 'COMPLETED' })
      const resource = makeResource(apiFetch)
      await resource.deposits.retrieve('d-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/deposit/d-1')
    })
  })

  describe('transfers.create', () => {
    it('calls POST /v1/transfer', async () => {
      const apiFetch = mockJson({ transfer_id: 't-1', short_reference_id: 'REF1' }, 201)
      const resource = makeResource(apiFetch)
      const result = await resource.transfers.create({ source_account_id: 'a1', target_account_id: 'a2', currency: 'USD', amount: '100', reason: 'test' })
      expect(result.transfer_id).toBe('t-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/transfer')
    })
  })

  describe('transfers.retrieve', () => {
    it('calls GET /v1/transfer/{id}', async () => {
      const apiFetch = mockJson({ transfer_id: 't-1' })
      const resource = makeResource(apiFetch)
      await resource.transfers.retrieve('t-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/transfer/t-1')
    })
  })

  describe('payouts.create', () => {
    it('calls POST /v1/payouts', async () => {
      const apiFetch = mockJson({ payout_id: 'p-1', short_reference_id: 'REF1' }, 201)
      const resource = makeResource(apiFetch)
      const result = await resource.payouts.create({ beneficiary_id: 'b-1', source_currency: 'USD', amount: '100', currency: 'USD', purpose_code: 'FAMILY_SUPPORT', fee_paid_by: 'OURS' })
      expect(result.payout_id).toBe('p-1')
    })
  })

  describe('beneficiaries.create', () => {
    it('calls POST /v1/beneficiaries', async () => {
      const apiFetch = mockJson({ beneficiary_id: 'ben-1', short_reference_id: 'REF1' }, 201)
      const resource = makeResource(apiFetch)
      const result = await resource.beneficiaries.create({
        entity_type: 'INDIVIDUAL',
        payment_method: 'LOCAL',
        first_name: 'John',
        last_name: 'Doe',
        bank_details: {
          account_number: '123',
          account_currency_code: 'USD',
          account_holder: 'John Doe',
          bank_name: 'Test Bank',
          bank_address: '1 Bank Street',
          bank_country_code: 'US',
        },
        address: {
          country: 'US',
          city: 'New York',
          street_address: '123 Main St',
          postal_code: '10001',
          state: 'NY',
        },
      })
      expect(result.beneficiary_id).toBe('ben-1')
    })
  })

  describe('beneficiaries.retrieve', () => {
    it('calls GET /v1/beneficiaries/{id}', async () => {
      const apiFetch = mockJson({ beneficiary_id: 'ben-1' })
      const resource = makeResource(apiFetch)
      await resource.beneficiaries.retrieve('ben-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/beneficiaries/ben-1')
    })
  })

  describe('conversions.createQuote', () => {
    it('calls POST /v1/conversion/quote', async () => {
      const apiFetch = mockJson({ quote_id: 'q-1', sell_currency: 'USD', buy_currency: 'EUR', sell_amount: 100, buy_amount: 92 })
      const resource = makeResource(apiFetch)
      const result = await resource.conversions.createQuote({ sell_currency: 'USD', buy_currency: 'EUR', conversion_date: '2024-01-01', sell_amount: '100' })
      expect(result.quote_id).toBe('q-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/conversion/quote')
    })
  })

  describe('conversions.create', () => {
    it('calls POST /v1/conversion', async () => {
      const apiFetch = mockJson({ conversion_id: 'c-1', short_reference_id: 'REF1' })
      const resource = makeResource(apiFetch)
      await resource.conversions.create({ quote_id: 'q-1', buy_currency: 'EUR', sell_currency: 'USD', conversion_date: '2024-01-01', sell_amount: 100 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/conversion')
      expect(url).not.toContain('/quote')
    })
  })

  describe('virtualAccounts.list', () => {
    it('calls GET /v1/virtual/accounts', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.virtualAccounts.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/virtual/accounts')
    })
  })

  describe('virtualAccounts.create', () => {
    it('submits the application contract with idempotency and connected-account headers', async () => {
      const apiFetch = mockJson({
        data: {
          application_id: 'app-1', public_version: 1, country: 'SG', currency: 'USD',
          status: 'SUBMITTED', results: [],
        },
      })
      const resource = makeResource(apiFetch)
      const result = await resource.virtualAccounts.create(
        { country: 'SG', currency: 'USD', payment_method: 'SWIFT', nickname: 'Collections' },
        { headers: { 'x-idempotency-key': 'va-retry-001', 'x-on-behalf-of': 'acct-sub' } }
      )
      expect(result.data.application_id).toBe('app-1')
      const [url, init] = apiFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/v1/virtual/accounts')
      expect(JSON.parse(init.body as string)).toEqual({
        country: 'SG', currency: 'USD', payment_method: 'SWIFT', nickname: 'Collections',
      })
      expect((init.headers as Record<string, string>)['x-idempotency-key']).toBe('va-retry-001')
      expect((init.headers as Record<string, string>)['x-on-behalf-of']).toBe('acct-sub')
      expect((init.headers as Record<string, string>)['x-request-id']).toBeUndefined()

      const replay = await resource.virtualAccounts.create(
        { country: 'SG', currency: 'USD', payment_method: 'SWIFT', nickname: 'Collections' },
        { headers: { 'x-idempotency-key': 'va-retry-001', 'x-on-behalf-of': 'acct-sub' } }
      )
      expect(replay.data.application_id).toBe(result.data.application_id)
      const replayHeaders = apiFetch.mock.calls[1]?.[1]?.headers as Record<string, string>
      expect(replayHeaders['x-idempotency-key']).toBe('va-retry-001')
    })
  })

  describe('virtualAccountApplications.list', () => {
    it('calls the application list endpoint without confusing issued accounts', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.virtualAccountApplications.list({
        page_number: 1, page_size: 50, status: 'SUBMITTED', country: 'SG', currency: 'USD',
      })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/virtual/applications?')
      expect(url).toContain('page_number=1')
      expect(url).toContain('page_size=50')
      expect(url).toContain('status=SUBMITTED')
      expect(url).not.toContain('/v1/virtual/accounts')
    })
  })

  describe('virtualAccountApplications.retrieve', () => {
    it('calls the application detail endpoint and preserves the response envelope', async () => {
      const apiFetch = mockJson({
        data: {
          application_id: 'app/unsafe', public_version: 3, country: 'BH', currency: 'GBP',
          status: 'CLOSED', results: [],
        },
      })
      const resource = makeResource(apiFetch)
      const result = await resource.virtualAccountApplications.retrieve('app/unsafe', {
        headers: { 'x-on-behalf-of': 'acct-sub' },
      })
      expect(result.data.public_version).toBe(3)
      const [url, init] = apiFetch.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/v1/virtual/applications/app%2Funsafe')
      expect((init.headers as Record<string, string>)['x-on-behalf-of']).toBe('acct-sub')
    })
  })

  describe('paymentMethods.list', () => {
    it('calls GET /v1/beneficiaries/paymentmethods', async () => {
      const apiFetch = mockJson([])
      const resource = makeResource(apiFetch)
      await resource.paymentMethods.list({ currency: 'USD', country: 'US' })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/beneficiaries/paymentmethods')
      expect(url).toContain('currency=USD')
    })
  })
})
