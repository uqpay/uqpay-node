import { describe, it, expect, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { WebhookVerifier } from '../src/webhooks.js'
import { UQPayWebhookError } from '../src/error.js'

const SECRET = 'whsec_test_secret'

function sign(body: string, timestamp: number): string {
  return createHmac('sha512', SECRET).update(body + String(timestamp)).digest('hex')
}

const NOW = Math.floor(Date.now() / 1000)
const BODY = JSON.stringify({ version: 'V1.6.0', event_name: 'ISSUING', event_type: 'card.create.succeeded', event_id: 'e1', source_id: 's1', data: {} })

describe('WebhookVerifier', () => {
  const verifier = new WebhookVerifier(SECRET)

  it('verifies a valid signature and returns typed event', () => {
    const sig = sign(BODY, NOW)
    const event = verifier.constructEvent(BODY, { 'x-wk-signature': sig, 'x-wk-timestamp': String(NOW) })
    expect(event.event_name).toBe('ISSUING')
    expect(event.event_type).toBe('card.create.succeeded')
    expect(event.event_id).toBe('e1')
  })

  it('preserves application-level VA source, version, results, and close reason', () => {
    const applicationId = '550e8400-e29b-41d4-a716-446655440000'
    const body = JSON.stringify({
      version: 'V1.6.0',
      event_name: 'VIRTUAL',
      event_type: 'virtual.account.closed',
      event_id: 'event-closed',
      source_id: applicationId,
      data: {
        application_id: applicationId,
        public_version: 3,
        country: 'BH',
        currency: 'GBP',
        status: 'CLOSED',
        results: [{
          payment_method: 'SWIFT',
          status: 'CLOSED',
          virtual_accounts: [{
            account_bank_id: 'bank-1', account_holder: 'Merchant', account_number: '001',
            country_code: 'BH', currency: 'GBP', bank_name: 'Bank', bank_address: 'Address',
            clearing_system: { type: 'bic_swift', value: 'BANKBHBM' },
            status: 'CLOSED', close_reason: '',
          }],
          error: null,
        }],
      },
    })
    const event = verifier.constructEvent(body, {
      'x-wk-signature': sign(body, NOW),
      'x-wk-timestamp': String(NOW),
    })
    expect(event.source_id).toBe(applicationId)
    expect((event.data as { application_id: string }).application_id).toBe(applicationId)
    expect((event.data as { public_version: number }).public_version).toBe(3)
    expect((event.data as { results: Array<{ virtual_accounts: Array<{ close_reason: string }> }> })
      .results[0]?.virtual_accounts[0]?.close_reason).toBe('')
  })

  it.each(['V1.5.1', 'V1.5.2', 'V1.6.0'])(
    'passes through the application DTO for supported Hub version %s',
    (version) => {
      const body = JSON.stringify({
        version,
        event_name: 'VIRTUAL',
        event_type: 'virtual.account.update',
        event_id: `event-${version}`,
        source_id: 'application-1',
        data: {
          application_id: 'application-1', public_version: 2, country: 'SG', currency: 'USD',
          status: 'FAILED', results: [{
            payment_method: 'SWIFT', status: 'FAILED', virtual_accounts: [],
            error: { code: 'VA_PROVISIONING_FAILED', message: 'Virtual account provisioning failed' },
          }],
        },
      })
      const event = verifier.constructEvent(body, {
        'x-wk-signature': sign(body, NOW),
        'x-wk-timestamp': String(NOW),
      })
      expect(event.version).toBe(version)
      expect((event.data as { application_id: string }).application_id).toBe(event.source_id)
      expect((event.data as { public_version: number }).public_version).toBe(2)
    }
  )

  it('throws on invalid signature', () => {
    expect(() =>
      verifier.constructEvent(BODY, { 'x-wk-signature': 'bad_sig', 'x-wk-timestamp': String(NOW) })
    ).toThrow(UQPayWebhookError)
  })

  it('throws on expired timestamp (> 5 minutes)', () => {
    const oldTs = NOW - 400  // 6+ minutes ago
    const sig = sign(BODY, oldTs)
    expect(() =>
      verifier.constructEvent(BODY, { 'x-wk-signature': sig, 'x-wk-timestamp': String(oldTs) })
    ).toThrow(/timestamp expired/)
  })

  it('throws when rawBody is an object (not a string)', () => {
    expect(() =>
      verifier.constructEvent({ parsed: true } as unknown as string, { 'x-wk-signature': 'sig', 'x-wk-timestamp': String(NOW) })
    ).toThrow(/rawBody must be the original request body string/)
  })

  it('throws when x-wk-signature header is missing', () => {
    expect(() =>
      verifier.constructEvent(BODY, { 'x-wk-timestamp': String(NOW) })
    ).toThrow(/missing/)
  })

  it('throws when x-wk-timestamp header is missing', () => {
    const sig = sign(BODY, NOW)
    expect(() =>
      verifier.constructEvent(BODY, { 'x-wk-signature': sig })
    ).toThrow(/missing/)
  })

  it('respects custom tolerance', () => {
    const oldTs = NOW - 100  // 100s ago
    const sig = sign(BODY, oldTs)
    // Default tolerance is 300s (5 min), so 100s should pass
    expect(() =>
      verifier.constructEvent(BODY, { 'x-wk-signature': sig, 'x-wk-timestamp': String(oldTs) })
    ).not.toThrow()

    // With 60s tolerance, 100s should fail
    const strictVerifier = new WebhookVerifier(SECRET, { tolerance: 60 })
    expect(() =>
      strictVerifier.constructEvent(BODY, { 'x-wk-signature': sig, 'x-wk-timestamp': String(oldTs) })
    ).toThrow(/timestamp expired/)
  })
})
