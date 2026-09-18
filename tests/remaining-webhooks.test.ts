import { readFileSync } from 'node:fs'
import { createHmac } from 'node:crypto'
import { expect, it } from 'vitest'
import { WebhookVerifier } from '../src/webhooks.js'
const cases = JSON.parse(readFileSync('tests/fixtures/remaining-webhooks.json', 'utf8')) as {kind: string; data: Record<string, unknown>}[]
it.each(cases)('preserves signed frozen $kind fields', ({kind, data}) => {
  const body = JSON.stringify({event_type: kind, data})
  const timestamp = String(Date.now())
  const signature = createHmac('sha512', 'offline-secret').update(body + timestamp).digest('hex')
  const headers = {'x-wk-signature': signature, 'x-wk-timestamp': timestamp}
  const verifier = new WebhookVerifier('offline-secret')
  expect(verifier.constructEvent(body, headers).data).toEqual(data)
  expect(() => verifier.constructEvent(body + ' ', headers)).toThrow()
})
