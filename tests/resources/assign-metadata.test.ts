import { afterEach, expect, it, vi } from 'vitest'
import { UQPayClient, type AssignCardParams } from '../../src/index.js'

afterEach(() => vi.unstubAllGlobals())

it('public client assigns Personal Visa metadata and omits it for existing calls', async () => {
  const requests: { path: string; method: string; body: unknown }[] = []
  const jwt = 'header.' + Buffer.from(JSON.stringify({ client_id: 'offline-client', exp: 4102444800 })).toString('base64url') + '.signature'
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname
    if (path === '/api/v1/connect/token') return new Response(JSON.stringify({ auth_token: jwt, expired_at: 4102444800 }), { headers: { 'content-type': 'application/json' } })
    requests.push({ path, method: init.method!, body: JSON.parse(init.body as string) })
    return new Response(JSON.stringify({ card_id: 'card-1' }), { headers: { 'content-type': 'application/json' } })
  }))
  const client = new UQPayClient({ clientId: 'offline-client', apiKey: 'offline-key', webhookSecret: 'offline-secret' })
  for (const metadata of [undefined, { card_sku_code: 'SKU123456789' }]) {
    const params: AssignCardParams = { cardholder_id: 'holder-1', card_number: 'example-pan', card_currency: 'USD', card_mode: 'SINGLE', ...(metadata ? { metadata } : {}) }
    expect((await client.issuing.cards.assign(params)).card_id).toBe('card-1')
    expect(requests.at(-1)).toEqual({ path: '/api/v1/issuing/cards/assign', method: 'POST', body: params })
    if (!metadata) expect(requests.at(-1)!.body).not.toHaveProperty('metadata')
  }
})
