import { describe, it, expect, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { IssuingResource } from '../../src/resources/issuing/index.js'

const FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  Buffer.from(JSON.stringify({ entity_id: 'a1', short_entity_id: 'CB001', parent_entity_id: '0', client_id: 'c1', api_version: 'V1.0', bus_type: 'ISSUING', exp: 9999999999 })).toString('base64url'),
  'sig',
].join('.')

function makeResource(apiFetch: typeof globalThis.fetch) {
  const tokenFetch = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ auth_token: FAKE_JWT, expired_at: 9999999999 }),
  })
  const tm = new TokenManager('cid', 'key', 'https://api.example.com', tokenFetch)
  const http = new HttpClient('https://api.example.com', tm, new Logger('none'), 'c1', '0.1.0', 30_000, apiFetch)
  return new IssuingResource(http, 'https://api-sandbox.example.com')
}

function mockJson(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400, status,
    headers: { get: (h: string) => h === 'content-type' ? 'application/json' : null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
}

describe('IssuingResource', () => {
  describe('cards.create', () => {
    it('calls POST /v1/issuing/cards', async () => {
      const apiFetch = mockJson({ card_id: 'card-1', card_order_id: 'order-1', create_time: '', card_status: 'PENDING', order_status: 'PENDING' }, 201)
      const resource = makeResource(apiFetch)
      const result = await resource.cards.create({ card_currency: 'SGD', cardholder_id: 'ch-1', card_product_id: 'prod-1' })
      expect(result.card_id).toBe('card-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/cards')
    })
  })

  describe('cards.list', () => {
    it('calls GET /v1/issuing/cards', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.cards.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/cards')
      expect(url).toContain('page_size=10')
    })
  })

  describe('cards.retrieve', () => {
    it('calls GET /v1/issuing/cards/{id}', async () => {
      const apiFetch = mockJson({ card_id: 'card-1', card_status: 'ACTIVE' })
      const resource = makeResource(apiFetch)
      await resource.cards.retrieve('card-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/cards/card-1')
      expect(url).not.toContain('/secure')
    })
  })

  describe('cards.retrieveSecure', () => {
    it('calls GET /v1/issuing/cards/{id}/secure', async () => {
      const apiFetch = mockJson({ cvv: '123', expire_date: '12/26', card_number: '4111111111111111' })
      const resource = makeResource(apiFetch)
      const result = await resource.cards.retrieveSecure('card-1')
      expect(result.cvv).toBe('123')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/cards/card-1/secure')
    })
  })

  describe('cards.updateStatus', () => {
    it('calls POST /v1/issuing/cards/{id}/status', async () => {
      const apiFetch = mockJson({ card_id: 'card-1', card_order_id: 'order-1', order_status: 'SUCCESS', update_reason: '' })
      const resource = makeResource(apiFetch)
      await resource.cards.updateStatus('card-1', { card_status: 'FROZEN' })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/cards/card-1/status')
    })
  })

  describe('cards.createPanToken', () => {
    it('calls POST /v1/issuing/cards/{id}/token', async () => {
      const apiFetch = mockJson({ token: 'pan_tok', expires_in: 60, expires_at: '2024-01-01T00:01:00Z' })
      const resource = makeResource(apiFetch)
      const result = await resource.cards.createPanToken('card-1')
      expect(result.token).toBe('pan_tok')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/cards/card-1/token')
    })
  })

  describe('cards.getSecureIframeUrl', () => {
    it('returns sandbox iframe URL with token and cardId', async () => {
      const apiFetch = mockJson({ token: 'pan_tok', expires_in: 60, expires_at: '2024-01-01T00:01:00Z' })
      const resource = makeResource(apiFetch)
      const result = await resource.cards.getSecureIframeUrl('card-1')
      expect(result.iframeUrl).toContain('https://embedded-sandbox.uqpaytech.com')
      expect(result.iframeUrl).toContain('token=pan_tok')
      expect(result.iframeUrl).toContain('cardId=card-1')
      expect(result.token).toBe('pan_tok')
      expect(result.expires_in).toBe(60)
    })

    it('includes lang and styles query params when provided', async () => {
      const apiFetch = mockJson({ token: 'pan_tok', expires_in: 60, expires_at: '2024-01-01T00:01:00Z' })
      const resource = makeResource(apiFetch)
      const result = await resource.cards.getSecureIframeUrl('card-1', { lang: 'zh', styles: { '.card': { color: 'red' } } })
      expect(result.iframeUrl).toContain('lang=zh')
      expect(result.iframeUrl).toContain('styles=')
    })
  })

  describe('cardholders.create', () => {
    it('calls POST /v1/issuing/cardholders', async () => {
      const apiFetch = mockJson({ cardholder_id: 'ch-1', cardholder_status: 'PENDING' }, 201)
      const resource = makeResource(apiFetch)
      const result = await resource.cardholders.create({ email: 'a@b.com', first_name: 'John', last_name: 'Doe', country_code: 'SG', phone_number: '+6512345678' })
      expect(result.cardholder_id).toBe('ch-1')
    })
  })

  describe('cardholders.list', () => {
    it('calls GET /v1/issuing/cardholders', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.cardholders.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/cardholders')
    })
  })

  describe('balances.list', () => {
    it('calls GET /v1/issuing/balances', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.balances.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/balances')
    })
  })

  describe('balances.retrieve', () => {
    it('calls POST /v1/issuing/balances with currency body', async () => {
      const apiFetch = mockJson({ balance_id: 'b-1', currency: 'SGD', available_balance: 500 })
      const resource = makeResource(apiFetch)
      const result = await resource.balances.retrieve('SGD')
      expect(result.currency).toBe('SGD')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/balances')
      const body = JSON.parse(apiFetch.mock.calls[0]?.[1]?.body as string)
      expect(body.currency).toBe('SGD')
    })
  })

  describe('transactions.list', () => {
    it('calls GET /v1/issuing/transactions', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.transactions.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/transactions')
    })
  })

  describe('transfers.create', () => {
    it('calls POST /v1/issuing/transfers', async () => {
      const apiFetch = mockJson({ transfer_id: 'tr-1' }, 201)
      const resource = makeResource(apiFetch)
      const result = await resource.transfers.create({ source_account_id: 'a1', destination_account_id: 'a2', currency: 'SGD', amount: 100 })
      expect(result.transfer_id).toBe('tr-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/transfers')
    })
  })

  describe('products.list', () => {
    it('calls GET /v1/issuing/products', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.products.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/products')
    })
  })

  describe('reports.create', () => {
    it('calls POST /v1/issuing/reports', async () => {
      const apiFetch = mockJson({ report_id: 'rpt-1' }, 201)
      const resource = makeResource(apiFetch)
      const result = await resource.reports.create({ report_type: 'SETTLEMENT', start_time: '2024-01-01T00:00:00Z', end_time: '2024-01-31T23:59:59Z' })
      expect(result.report_id).toBe('rpt-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/issuing/reports')
    })
  })
})
