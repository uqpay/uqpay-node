import { describe, it, expect, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { SimulatorResource } from '../../src/resources/simulator/index.js'
import { SimulatorNotAvailableError } from '../../src/error.js'

const FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  Buffer.from(JSON.stringify({ entity_id: 'a1', short_entity_id: 'CB001', parent_entity_id: '0', client_id: 'c1', api_version: 'V1.0', bus_type: 'BANKING', exp: 9999999999 })).toString('base64url'),
  'sig',
].join('.')

function makeResource(apiFetch: typeof globalThis.fetch, baseUrl = 'https://api-sandbox.example.com') {
  const tokenFetch = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ auth_token: FAKE_JWT, expired_at: 9999999999 }),
  })
  const tm = new TokenManager('cid', 'key', baseUrl, tokenFetch)
  const http = new HttpClient(baseUrl, tm, new Logger('none'), 'c1', '0.1.0', 30_000, apiFetch)
  return new SimulatorResource(http, baseUrl)
}

function mockJson(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400, status,
    headers: { get: (h: string) => h === 'content-type' ? 'application/json' : null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  })
}

describe('SimulatorResource', () => {
  describe('issuing.authorize', () => {
    it('calls POST /v1/simulation/issuing/authorization', async () => {
      const apiFetch = mockJson({ card_id: 'card-1', transaction_id: 'txn-1', transaction_status: 'APPROVED', card_number: '4111****1111', cardholder_id: 'ch-1', transaction_type: 'PURCHASE', card_available_balance: 900, billing_amount: 100, billing_currency: 'SGD', transaction_amount: 100, transaction_currency: 'SGD', transaction_time: '2024-01-01T00:00:00Z' })
      const resource = makeResource(apiFetch)
      const result = await resource.issuing.authorize({ card_id: 'card-1', transaction_amount: 100, transaction_currency: 'SGD', merchant_name: 'Test', merchant_category_code: '5734', transaction_status: 'APPROVED' })
      expect(result.transaction_id).toBe('txn-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/simulation/issuing/authorization')
    })
  })

  describe('issuing.reverse', () => {
    it('calls POST /v1/simulation/issuing/reversal', async () => {
      const apiFetch = mockJson({ card_id: 'card-1', transaction_id: 'txn-1', transaction_status: 'REVERSED', card_number: '4111****1111', cardholder_id: 'ch-1', transaction_type: 'REVERSAL', card_available_balance: 1000, billing_amount: 100, billing_currency: 'SGD', transaction_amount: 100, transaction_currency: 'SGD', transaction_time: '2024-01-01T00:00:00Z' })
      const resource = makeResource(apiFetch)
      const result = await resource.issuing.reverse({ transaction_id: 'txn-1' })
      expect(result.transaction_id).toBe('txn-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/simulation/issuing/reversal')
    })
  })

  describe('deposits.simulate', () => {
    it('calls POST /v1/simulation/deposit', async () => {
      const apiFetch = mockJson({ deposit_id: 'dep-1', short_reference_id: 'REF1', amount: '100', currency: 'SGD', deposit_status: 'PENDING', create_time: '2024-01-01T00:00:00Z' })
      const resource = makeResource(apiFetch)
      const result = await resource.deposits.simulate({ amount: 100, currency: 'SGD', sender_swift_code: 'DBSSSGSG' })
      expect(result.deposit_id).toBe('dep-1')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/simulation/deposit')
    })
  })

  describe('production guard', () => {
    it('throws SimulatorNotAvailableError when baseUrl is production (issuing.authorize)', () => {
      const apiFetch = vi.fn()
      const resource = makeResource(apiFetch, 'https://api.uqpay.com/api')
      expect(() => resource.issuing.authorize({ card_id: 'c', transaction_amount: 1, transaction_currency: 'SGD', merchant_name: 'M', merchant_category_code: '5734', transaction_status: 'APPROVED' })).toThrow(SimulatorNotAvailableError)
    })

    it('throws SimulatorNotAvailableError when baseUrl is production (issuing.reverse)', () => {
      const apiFetch = vi.fn()
      const resource = makeResource(apiFetch, 'https://api.uqpay.com/api')
      expect(() => resource.issuing.reverse({ transaction_id: 'txn-1' })).toThrow(SimulatorNotAvailableError)
    })

    it('does not call fetch when production guard throws', () => {
      const apiFetch = vi.fn()
      const resource = makeResource(apiFetch, 'https://api.uqpay.com/api')
      expect(() => resource.deposits.simulate({ amount: 1, currency: 'SGD', sender_swift_code: 'DBSSSGSG' })).toThrow(SimulatorNotAvailableError)
      expect(apiFetch).not.toHaveBeenCalled()
    })
  })
})
