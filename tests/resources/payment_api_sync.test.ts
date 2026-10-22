import { describe, it, expect, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { PaymentResource } from '../../src/resources/payment/index.js'
import type { CapturePaymentIntentParams, PaymentIntentStatus } from '../../src/resources/payment/types.js'

describe('payment API sync', () => {
 it('preserves pre-authorization, capture acceptance and nullable processing details', async () => {
  const response = { payment_intent_id: 'pi-1', amount: '10.00', captured_amount: '6.00', currency: 'SGD', intent_status: 'PARTIALLY_CAPTURED', authorization_expires_at: null, available_to_capture: '0.00', available_to_void: '0.00', capture_id: 'cap-1', merchant_capture_order_id: 'order-cap-1', capture_records: [{capture_id: 'cap-1', merchant_capture_order_id: null, channel_capture_status: 0, complete_time: null}] }
  const apiFetch = vi.fn().mockResolvedValue({ok: true, status: 200, headers: {get: () => 'application/json'}, json: async () => response})
  const tokenFetch = vi.fn().mockResolvedValue({ok: true, status: 200, json: async () => ({auth_token: ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({entity_id: 'a1', short_entity_id: 'CB001', parent_entity_id: '0', client_id: 'c1', api_version: 'V1.0', bus_type: 'PAYMENT', exp: 4102444800})).toString('base64url'), 'sig'].join('.'), expired_at: 4102444800})})
  const resource = new PaymentResource(new HttpClient('https://example.test', new TokenManager('c1', 'offline-key', 'https://example.test', tokenFetch), new Logger('none'), 'c1', '3.1.0', 30000, apiFetch), 'c1')
  const authorization = {authorization_type: 'pre_authorization' as const, payment_method: {type: 'card_present', card_present: {authorization_type: 'pre_authorization', auto_capture: false}}}
  await resource.paymentIntents.create({...authorization, amount: '10.00', currency: 'SGD', merchant_order_id: 'o-1', description: 'test', return_url: 'https://example.test/return'})
  await resource.paymentIntents.confirm('pi-1', authorization)
  const capture: CapturePaymentIntentParams = {amount_to_capture: '6.00', merchant_capture_order_id: 'order-cap-1', final_capture: true}
  const result = await resource.paymentIntents.capture('pi-1', capture)
  expect(apiFetch.mock.calls.map(call => [call[1].method, new URL(call[0]).pathname])).toEqual([['POST', '/v2/payment_intents/create'], ['POST', '/v2/payment_intents/pi-1/confirm'], ['POST', '/v2/payment_intents/pi-1/capture']])
  expect(JSON.parse(apiFetch.mock.calls[0]![1].body)).toMatchObject(authorization)
  expect(JSON.parse(apiFetch.mock.calls[1]![1].body)).toMatchObject(authorization)
  expect(JSON.parse(apiFetch.mock.calls[2]![1].body)).toEqual(capture)
  expect(result.capture_id).toBe('cap-1')
  expect(result.authorization_expires_at).toBeNull()
  expect(result.capture_records?.[0]?.channel_capture_status).toBe(0)
  expect(result.captured_amount).toBe('6.00')
  await resource.paymentIntents.capture('pi-1')
  expect(JSON.parse(apiFetch.mock.calls[3]![1].body)).toEqual({})
  const expired: PaymentIntentStatus = 'EXPIRED'
  expect(expired).toBe('EXPIRED')
 })
})

import { createHmac } from 'node:crypto'
import { WebhookVerifier } from '../../src/webhooks.js'

it('preserves chargeback alert fields, updated statuses and card issuer countries in signed payloads', () => {
 const verifier = new WebhookVerifier('offline-secret')
 for (const order_status of ['FAILED', 'SUCCEEDED', 'CANCELLED', 'INITIATED', 'AUTHENTICATION_REDIRECTED', 'PENDING_AUTHORIZATION', 'AUTHORIZED', 'CAPTURE_REQUESTED', 'SETTLED', 'EXPIRED']) {
  const event = {version: 'V1.6.0', event_id: 'evt-1', event_name: 'ACQUIRING', event_type: 'acquiring.chargeback.alert.created', data: {order_status, alert_status: 'EXPIRED', card_scheme: 'VISA', card_masked: '411111******1111', auth_code: 'test', arn: 'reference', payment_method: {card: {issuer_country_code: 'SG'}, card_present: {issuer_country_code: ''}}}}
  const raw = JSON.stringify(event)
  const timestamp = Date.now().toString()
  const signature = createHmac('sha512', 'offline-secret').update(raw + timestamp).digest('hex')
  expect(verifier.constructEvent(raw, {'x-wk-signature': signature, 'x-wk-timestamp': timestamp})).toEqual(event)
 }
})

import type { ListPaymentIntentsParams } from '../../src/resources/payment/types.js'
it('maps legacy list aliases to wire keys and preserves explicit empty values and zero pagination', async () => {
 const apiFetch = vi.fn().mockResolvedValue({ok: true, status: 200, headers: {get: () => 'application/json'}, json: async () => ({data: [], total_pages: 0, total_items: 0})})
 const token = ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify({entity_id: 'a1', short_entity_id: 'CB001', parent_entity_id: '0', client_id: 'c1', api_version: 'V1.0', bus_type: 'PAYMENT', exp: 4102444800})).toString('base64url'), 'sig'].join('.')
 const tokenFetch = vi.fn().mockResolvedValue({ok: true, status: 200, json: async () => ({auth_token: token, expired_at: 4102444800})})
 const resource = new PaymentResource(new HttpClient('https://example.test', new TokenManager('c1', 'offline-key', 'https://example.test', tokenFetch), new Logger('none'), 'c1', '3.1.0', 30000, apiFetch), 'c1')
 const cases: {params?: ListPaymentIntentsParams; expected: Record<string, string>}[] = [
  {params: {intent_status: 'EXPIRED', create_start_time: '2026-10-22T00:00:00+08:00', create_end_time: 'legacy-end'}, expected: {payment_intent_status: 'EXPIRED', start_time: '2026-10-22T00:00:00+08:00', end_time: 'legacy-end'}},
  {params: {payment_intent_status: 'PARTIALLY_CAPTURED', start_time: 'wire-start', end_time: 'wire-end', intent_status: 'EXPIRED', create_start_time: 'legacy-start', create_end_time: 'legacy-end'}, expected: {payment_intent_status: 'PARTIALLY_CAPTURED', start_time: 'wire-start', end_time: 'wire-end'}},
  {params: {start_time: '', end_time: '', create_start_time: 'legacy-start', create_end_time: 'legacy-end', page_size: 0, page_number: 0}, expected: {start_time: '', end_time: '', page_size: '0', page_number: '0'}},
  // JavaScript callers may explicitly pass undefined despite exactOptionalPropertyTypes.
  {params: {payment_intent_status: undefined, start_time: undefined, end_time: undefined, intent_status: 'EXPIRED', create_start_time: '', create_end_time: ''} as unknown as ListPaymentIntentsParams, expected: {payment_intent_status: 'EXPIRED', start_time: '', end_time: ''}},
  {params: {payment_intent_status: '' as PaymentIntentStatus, intent_status: 'EXPIRED'}, expected: {payment_intent_status: ''}},
  {expected: {}},
 ]
 for (const {params, expected} of cases) {
  await resource.paymentIntents.list(params)
  const call = apiFetch.mock.calls.at(-1)!
  const url = new URL(call[0])
  expect(call[1].method).toBe('GET')
  expect(url.pathname).toBe('/v2/payment_intents')
  expect(Object.fromEntries(url.searchParams)).toEqual(expected)
  for (const key of ['intent_status', 'create_start_time', 'create_end_time']) expect(url.searchParams.has(key)).toBe(false)
 }
})
