import { describe, it, expect, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { WebhookVerifier } from '../src/webhooks.js'
import { UQPayWebhookError } from '../src/error.js'

const SECRET = 'whsec_test_secret'

function sign(body: string, timestamp: number): string {
  return createHmac('sha512', SECRET).update(body + String(timestamp)).digest('hex')
}

const NOW = Math.floor(Date.now() / 1000)
const BODY = JSON.stringify({ version: 'V1.6.0', event_type: 'ISSUING', event_name: 'card.create.succeeded', event_id: 'e1', source_id: 's1', data: {} })

describe('WebhookVerifier', () => {
  const verifier = new WebhookVerifier(SECRET)

  it('verifies a valid signature and returns typed event', () => {
    const sig = sign(BODY, NOW)
    const event = verifier.constructEvent(BODY, { 'x-wk-signature': sig, 'x-wk-timestamp': String(NOW) })
    expect(event.event_type).toBe('ISSUING')
    expect(event.event_name).toBe('card.create.succeeded')
    expect(event.event_id).toBe('e1')
  })

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
