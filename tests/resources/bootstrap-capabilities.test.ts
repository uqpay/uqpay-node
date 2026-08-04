import { describe, expect, it, vi } from 'vitest'
import { TokenManager } from '../../src/auth.js'
import { HttpClient } from '../../src/http.js'
import { Logger } from '../../src/logger.js'
import { AccountResource } from '../../src/resources/account/index.js'
import { IssuingResource } from '../../src/resources/issuing/index.js'
import { PaymentResource } from '../../src/resources/payment/index.js'

const FAKE_JWT = `x.${Buffer.from(JSON.stringify({ exp: 9999999999 })).toString('base64url')}.x`

function resources() {
  const tokenFetch = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ auth_token: FAKE_JWT, expired_at: 9999999999 }),
  })
  const apiFetch = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({}), text: async () => '{}',
  })
  const tokenManager = new TokenManager('cid', 'key', 'https://api.example.com', tokenFetch)
  const http = new HttpClient('https://api.example.com', tokenManager, new Logger('none'), 'cid', '0.3.1', 30_000, apiFetch)
  return {
    account: new AccountResource(http),
    issuing: new IssuingResource(http, 'https://api-sandbox.example.com'),
    payment: new PaymentResource(http, 'cid'),
    apiFetch,
  }
}

function requestAt(apiFetch: ReturnType<typeof vi.fn>, index: number) {
  const [url, init] = apiFetch.mock.calls[index] as [string, RequestInit]
  return { url, method: init.method, body: init.body ? JSON.parse(String(init.body)) : undefined }
}

describe('v1.2.0 core capability routes', () => {
  it('covers the Connect RFI operations', async () => {
    const { account, apiFetch } = resources()
    await account.rfis.list({ page_size: 10, page_number: 1, status: 'ACTION_REQUIRED' })
    await account.rfis.retrieve('rfi-1')
    await account.rfis.answer({ rfi_id: 'rfi-1', answer: [] })

    expect(requestAt(apiFetch, 0)).toMatchObject({ method: 'GET' })
    expect(requestAt(apiFetch, 0).url).toContain('/v1/rfis?page_size=10&page_number=1&status=ACTION_REQUIRED')
    expect(requestAt(apiFetch, 1).url).toContain('/v1/rfis/rfi-1')
    expect(requestAt(apiFetch, 2)).toMatchObject({ method: 'POST', body: { rfi_id: 'rfi-1', answer: [] } })
  })

  it('covers the Issuing capability operations including DELETE body', async () => {
    const { issuing, apiFetch } = resources()
    await issuing.cards.retrieveOrder('card-1')
    await issuing.cards.elevateLimit('card-1', { limit_amount: 100 })
    await issuing.cards.enrollNetworkProtection('card-1', { risk_control: 'network_protection', action_code: '04' })
    await issuing.cards.removeNetworkProtection('card-1', { risk_control: 'network_protection' })
    await issuing.cards.resetPin({ card_id: 'card-1', pin: '123456' })
    await issuing.cards.managePin({ card_id: 'card-1', type: 'SET', pin: '1234' })
    await issuing.cards.listArts({ card_product_id: 'product-1' })
    await issuing.cards.setDefaultArt({ card_art_id: 'art-1' })
    await issuing.merchantBrands.list({ page_size: 10, page_number: 1, merchant_code: '5411' })
    await issuing.transactions.claimUnsolicitedRefund({ related_transaction_id: 'tx-1' })

    const expected = [
      ['GET', '/v1/issuing/cards/card-1/order'],
      ['POST', '/v1/issuing/cards/card-1/elevate_limit'],
      ['POST', '/v1/issuing/cards/card-1/risk'],
      ['DELETE', '/v1/issuing/cards/card-1/risk'],
      ['POST', '/v1/issuing/cards/pin'],
      ['POST', '/v1/issuing/cards/manage/pin'],
      ['GET', '/v1/issuing/cards/arts?card_product_id=product-1'],
      ['POST', '/v1/issuing/cards/arts/default'],
      ['GET', '/v1/issuing/merchant_brands?page_size=10&page_number=1&merchant_code=5411'],
      ['POST', '/v1/issuing/transactions/unsolicited_refund/release'],
    ]
    expected.forEach(([method, path], index) => {
      expect(requestAt(apiFetch, index).method).toBe(method)
      expect(requestAt(apiFetch, index).url).toContain(path)
    })
    expect(requestAt(apiFetch, 3).body).toEqual({ risk_control: 'network_protection' })
  })

  it('covers both Payment terminal operations with x-client-id', async () => {
    const { payment, apiFetch } = resources()
    await payment.terminals.register({ firm_code: '01', firm_sn: 'sn-1', terminal_model: 'model-1' })
    await payment.terminals.getPinKey({ terminal_id: 'terminal-1', prv_key: 'secret' })

    expect(requestAt(apiFetch, 0).url).toContain('/v2/terminal/register')
    expect(requestAt(apiFetch, 1).url).toContain('/v2/terminal/getPinKey')
    for (const call of apiFetch.mock.calls) {
      expect((call[1] as RequestInit).headers).toMatchObject({ 'x-client-id': 'cid' })
    }
  })
})
