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

describe('Banking API sync', () => {
  it('retains absent and empty data envelopes without manufacturing arrays', async () => {
    const absent = makeResource(mockJson({}))
    const empty = makeResource(mockJson({ data: [] }))
    expect((await absent.paymentMethods.list({ currency: 'USD', country: 'US' })).data).toBeUndefined()
    expect((await empty.paymentMethods.list({ currency: 'USD', country: 'US' })).data).toEqual([])
  })
  it('sends payout validation query and preserves boolean result fields', async () => {
    const apiFetch = mockJson({ channel_code: 'MASTERCARD', sufficient_funds: false, beneficiary_valid: true, fee_amount: '5', total_amount: '6' })
    const resource = makeResource(apiFetch)
    const result = await resource.payouts.validate({ beneficiary_id: 'saved + id', currency: 'USD', amount: '1.00', fee_paid_by: 'OURS' }, { headers: { 'x-on-behalf-of': 'sub-account' } })
    const url = new URL(apiFetch.mock.calls[0]![0] as string)
    expect(url.pathname).toBe('/v1/payouts/validation')
    const headers = (apiFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>
    expect(headers['x-on-behalf-of']).toBe('sub-account')
    expect(url.searchParams.get('beneficiary_id')).toBe('saved + id')
    expect(url.searchParams.get('amount')).toBe('1.00')
    expect(url.searchParams.get('currency')).toBe('USD')
    expect(url.searchParams.get('fee_paid_by')).toBe('OURS')
    const request = apiFetch.mock.calls[0]![1] as RequestInit
    expect(request.method).toBe('GET')
    expect(request.body).toBeNull()
    expect(result.sufficient_funds).toBe(false)
    expect(result.channel_code).toBe('MASTERCARD')
    expect(result.beneficiary_valid).toBe(true)
    expect(result.fee_amount).toBe('5')
    expect(result.total_amount).toBe('6')
  })

  it('retains heterogeneous method rules and sends CARD filters and bodies', async () => {
    const rules = { data: [{ country: 'US', currency: 'USD', clearing_systems: 'MASTERCARD SEND', payment_method: 'CARD', validation_field: ['account_number', { value: 'card_expiry', children: [{ type: 'MONTH' }] }] }] }
    const apiFetch = mockJson(rules)
    const resource = makeResource(apiFetch)
    const result = await resource.paymentMethods.list({ currency: 'USD', country: 'US', entity_type: 'INDIVIDUAL' })
    expect(result).toEqual(rules)
    const method = result.data?.[0]
    expect(method?.country).toBe('US')
    expect(method?.clearing_systems).toBe('MASTERCARD SEND')
    expect(method?.validation_field?.[0]).toBe('account_number')
    const field = method?.validation_field?.[1]
    if (!field || typeof field === 'string') throw new Error('Expected a validation rule object')
    expect(field.value).toBe('card_expiry')
    expect(field.children?.[0]?.type).toBe('MONTH')
    expect(String(apiFetch.mock.calls[0]![0])).toContain('entity_type=INDIVIDUAL')
    await resource.beneficiaries.list({ page_number: 1, page_size: 10, payment_method: 'CARD' })
    expect(String(apiFetch.mock.calls[1]![0])).toContain('payment_method=CARD')
    await resource.beneficiaries.create({ entity_type: 'INDIVIDUAL', payment_method: 'CARD', bank_details: { account_holder: 'Test Recipient', account_number: '1234567890123', account_currency_code: 'USD', bank_country_code: 'US', clearing_system: 'MASTERCARD SEND', card_expiry: '2099-12' } })
    const body = JSON.parse((apiFetch.mock.calls[2]![1] as RequestInit).body as string)
    expect(body.bank_details.card_expiry).toBe('2099-12')
    expect(body.address).toBeUndefined()
    await resource.payouts.create({ currency: 'USD', amount: '1', purpose_code: 'BILL_PAYMENT', beneficiary_id: 'saved' })
    const payout = JSON.parse((apiFetch.mock.calls[3]![1] as RequestInit).body as string)
    expect(payout.fee_paid_by).toBeUndefined()
  })
})
