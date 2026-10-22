import { expect, it, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { IssuingResource } from '../../src/resources/issuing/index.js'
import type { CardholderIdentity, ResidentialAddressResponse } from '../../src/resources/issuing/types.js'

it('sends supporting-only updates and omitted holders and retains sparse response addresses', async () => {
  const response = (body: unknown) => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => body, text: async () => JSON.stringify(body) })
  const api = vi.fn().mockResolvedValue(response({}))
  const jwt = 'header.' + Buffer.from(JSON.stringify({ client_id: 'client', exp: 4102444800 })).toString('base64url') + '.signature'
  const token = new TokenManager('client', 'offline-key', 'https://example.test', vi.fn().mockResolvedValue(response({ auth_token: jwt, expired_at: 4102444800 })))
  const issuing = new IssuingResource(new HttpClient('https://example.test', token, new Logger('none'), 'client', '3.1.0', 30000, api), 'https://example.test')
  const route = (method: string, path: string) => { expect(api.mock.lastCall![1].method).toBe(method); expect(new URL(api.mock.lastCall![0]).pathname).toBe(path) }
  const identity: CardholderIdentity = { proof_of_address: 'cGRm', proof_of_address_issue_date: '2026-10-01', proof_of_address_issuing_country: 'SG', identity_verification: 'a3lj' }
  await issuing.cardholders.update('holder-1', { identity })
  route('POST', '/v1/issuing/cardholders/holder-1')
  expect(JSON.parse(api.mock.lastCall![1].body)).toEqual({ identity })
  expect(new URL(api.mock.lastCall![0]).pathname).toBe('/v1/issuing/cardholders/holder-1')
  await issuing.cardholders.create({ email: 'test@example.test', first_name: 'Test', last_name: 'User', country_code: 'SG', phone_number: '81234567', identity: { ...identity, type: 'PASSPORT', number: 'example', front_file: 'ZnJvbnQ=' } })
  route('POST', '/v1/issuing/cardholders')
  expect(JSON.parse(api.mock.lastCall![1].body).identity).toMatchObject(identity)
  for (const value of [null, '']) {
    await issuing.cardholders.update('holder-1', { identity: { proof_of_address: value, identity_verification: value } })
    route('POST', '/v1/issuing/cardholders/holder-1')
    expect(JSON.parse(api.mock.lastCall![1].body)).toEqual({ identity: { proof_of_address: value, identity_verification: value } })
  }
  await issuing.cards.create({ card_currency: 'USD', card_product_id: 'product-1' })
  route('POST', '/v1/issuing/cards')
  expect(JSON.parse(api.mock.lastCall![1].body)).toEqual({ card_currency: 'USD', card_product_id: 'product-1' })
  await issuing.cards.assign({ card_number: 'example-pan', card_currency: 'USD', card_mode: 'SINGLE' })
  route('POST', '/v1/issuing/cards/assign')
  expect(JSON.parse(api.mock.lastCall![1].body)).not.toHaveProperty('cardholder_id')
  const address: ResidentialAddressResponse = { line2: null }
  api.mockResolvedValue(response({ cardholder_id: 'holder-1', residential_address: address }))
  expect((await issuing.cardholders.retrieve('holder-1')).residential_address).toEqual(address)
  route('GET', '/v1/issuing/cardholders/holder-1')
})
