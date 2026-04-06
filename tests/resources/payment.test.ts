import { describe, it, expect, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { PaymentResource } from '../../src/resources/payment/index.js'

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
  return new PaymentResource(http, 'c1')
}

function mockJson(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400, status,
    headers: { get: (h: string) => h === 'content-type' ? 'application/json' : null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
}

describe('PaymentResource', () => {
  describe('paymentIntents.create', () => {
    it('calls POST /v2/payment_intents/create', async () => {
      const apiFetch = mockJson({ payment_intent_id: 'pi-1', amount: '10.00', currency: 'SGD', intent_status: 'REQUIRES_PAYMENT_METHOD' })
      const resource = makeResource(apiFetch)
      const result = await resource.paymentIntents.create({ amount: '10.00', currency: 'SGD', merchant_order_id: 'ord-1', return_url: 'https://example.com', description: 'test' })
      expect(result.payment_intent_id).toBe('pi-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment_intents/create')
      const headers = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
      expect(headers?.['x-client-id']).toBe('c1')
    })
  })

  describe('paymentIntents.list', () => {
    it('calls GET /v2/payment_intents with query params', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.paymentIntents.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment_intents')
      expect(url).toContain('page_size=10')
      expect(url).not.toContain('/create')
    })
  })

  describe('paymentIntents.retrieve', () => {
    it('calls GET /v2/payment_intents/{id}', async () => {
      const apiFetch = mockJson({ payment_intent_id: 'pi-1', amount: '10.00', currency: 'SGD', intent_status: 'SUCCEEDED' })
      const resource = makeResource(apiFetch)
      await resource.paymentIntents.retrieve('pi-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment_intents/pi-1')
    })
  })

  describe('paymentIntents.confirm', () => {
    it('calls POST /v2/payment_intents/{id}/confirm', async () => {
      const apiFetch = mockJson({ payment_intent_id: 'pi-1', amount: '10.00', currency: 'SGD', intent_status: 'REQUIRES_CAPTURE' })
      const resource = makeResource(apiFetch)
      await resource.paymentIntents.confirm('pi-1', {})
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment_intents/pi-1/confirm')
    })
  })

  describe('paymentIntents.capture', () => {
    it('calls POST /v2/payment_intents/{id}/capture', async () => {
      const apiFetch = mockJson({ payment_intent_id: 'pi-1', amount: '10.00', currency: 'SGD', intent_status: 'SUCCEEDED' })
      const resource = makeResource(apiFetch)
      await resource.paymentIntents.capture('pi-1', {})
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment_intents/pi-1/capture')
    })
  })

  describe('paymentIntents.cancel', () => {
    it('calls POST /v2/payment_intents/{id}/cancel', async () => {
      const apiFetch = mockJson({ payment_intent_id: 'pi-1', amount: '10.00', currency: 'SGD', intent_status: 'CANCELLED' })
      const resource = makeResource(apiFetch)
      await resource.paymentIntents.cancel('pi-1', { cancellation_reason: 'duplicate' })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment_intents/pi-1/cancel')
      const body = JSON.parse(apiFetch.mock.calls[0]?.[1]?.body as string)
      expect(body.cancellation_reason).toBe('duplicate')
    })
  })

  describe('refunds.create', () => {
    it('calls POST /v2/payment/refunds', async () => {
      const apiFetch = mockJson({ payment_refund_id: 'ref-1', payment_attempt_id: 'att-1', amount: '5.00', currency: 'SGD', refund_status: 'INITIATED' })
      const resource = makeResource(apiFetch)
      const result = await resource.refunds.create({ payment_intent_id: 'pi-1', amount: '5.00', reason: 'duplicate' })
      expect(result.payment_refund_id).toBe('ref-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/refunds')
    })
  })

  describe('refunds.retrieve', () => {
    it('calls GET /v2/payment/refunds/{id}', async () => {
      const apiFetch = mockJson({ payment_refund_id: 'ref-1', payment_attempt_id: 'att-1', amount: '5.00', currency: 'SGD', refund_status: 'SUCCEEDED' })
      const resource = makeResource(apiFetch)
      await resource.refunds.retrieve('ref-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/refunds/ref-1')
    })
  })

  describe('payouts.create', () => {
    it('calls POST /v2/payment/payout/create', async () => {
      const apiFetch = mockJson({ payout_id: 'po-1', payout_currency: 'SGD', payout_amount: '100.00', statement_descriptor: 'Test', payout_status: 'INITIATED' })
      const resource = makeResource(apiFetch)
      const result = await resource.payouts.create({ payout_currency: 'SGD', payout_amount: '100.00', statement_descriptor: 'Test' })
      expect(result.payout_id).toBe('po-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/payout/create')
    })
  })

  describe('payouts.list', () => {
    it('calls GET /v2/payment/payout', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.payouts.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/payout')
      expect(url).not.toContain('/create')
    })
  })

  describe('bankAccounts.create', () => {
    it('calls POST /v2/payment/bankaccount/create', async () => {
      const apiFetch = mockJson({ id: 'ba-1', currency: 'USD', account_number: '123', bank_name: 'DBS', swift_code: 'DBSSSGSG', bank_country_code: 'SG', bank_address: '12 Marina Blvd, Singapore' })
      const resource = makeResource(apiFetch)
      const result = await resource.bankAccounts.create({ currency: 'USD', account_number: '123', bank_name: 'DBS', swift_code: 'DBSSSGSG', bank_country_code: 'SG', bank_address: '12 Marina Blvd, Singapore' })
      expect(result.id).toBe('ba-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/bankaccount/create')
      const headers = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
      expect(headers?.['x-client-id']).toBe('c1')
    })
  })

  describe('bankAccounts.retrieve', () => {
    it('calls GET /v2/payment/bankaccount/{id}', async () => {
      const apiFetch = mockJson({ id: 'ba-1', currency: 'SGD', account_number: '123', bank_name: 'DBS', swift_code: 'DBSSSGSG', bank_country_code: 'SG' })
      const resource = makeResource(apiFetch)
      await resource.bankAccounts.retrieve('ba-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/bankaccount/ba-1')
    })
  })

  describe('balances.list', () => {
    it('calls GET /v2/payment/balances', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.balances.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/balances')
    })
  })

  describe('balances.retrieve', () => {
    it('calls GET /v2/payment/balances/{currency}', async () => {
      const apiFetch = mockJson({ currency: 'SGD', available_balance: '1000.00', pending_balance: '0.00' })
      const resource = makeResource(apiFetch)
      const result = await resource.balances.retrieve('SGD')
      expect(result.currency).toBe('SGD')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/balances/SGD')
    })
  })

  describe('paymentAttempts.list', () => {
    it('calls GET /v2/payment/payment_attempts', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.paymentAttempts.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/payment_attempts')
    })
  })

  describe('settlements.list', () => {
    it('calls GET /v2/payment/settlements', async () => {
      const apiFetch = mockJson({ total_pages: 1, total_items: 0, data: [] })
      const resource = makeResource(apiFetch)
      await resource.settlements.list({ page_size: 10, page_number: 1 })
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v2/payment/settlements')
    })
  })
})
