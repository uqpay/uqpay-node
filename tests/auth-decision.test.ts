import { describe, it, expect, vi, beforeAll } from 'vitest'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import * as openpgp from 'openpgp'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { Socket } from 'node:net'
import { AuthDecisionResource } from '../src/resources/issuing/auth-decision.js'
import { generateAuthDecisionKeyPair } from '../src/crypto/pgp.js'

let customerKeys: { publicKey: string; privateKey: string }
let uqpayKeys: { publicKey: string; privateKey: string }

beforeAll(async () => {
  customerKeys = await generateAuthDecisionKeyPair({ name: 'Customer', email: 'c@test.com' })
  uqpayKeys = await generateAuthDecisionKeyPair({ name: 'UQPAY', email: 'u@test.com' })
}, 30000)

async function encryptAsUqpay(body: object): Promise<string> {
  const message = await openpgp.createMessage({ text: JSON.stringify(body) })
  return await openpgp.encrypt({
    message,
    encryptionKeys: await openpgp.readKey({ armoredKey: customerKeys.publicKey }),
  }) as string
}

async function decryptAsUqpay(ciphertext: string): Promise<object> {
  const message = await openpgp.readMessage({ armoredMessage: ciphertext })
  const { data } = await openpgp.decrypt({
    message,
    decryptionKeys: await openpgp.readPrivateKey({ armoredKey: uqpayKeys.privateKey }),
  })
  return JSON.parse(data as string)
}

function createRequest(body: string): IncomingMessage {
  const readable = new Readable()
  readable.push(body)
  readable.push(null)
  Object.assign(readable, {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    method: 'POST',
    url: '/auth-decision',
  })
  return readable as unknown as IncomingMessage
}

/** Create a fake ServerResponse that resolves a promise when res.end() is called. */
function createResponse(): {
  res: ServerResponse
  getBody: () => string
  getStatus: () => number
  done: Promise<void>
} {
  let resolveDone: () => void
  const done = new Promise<void>((r) => { resolveDone = r })

  const socket = new Socket()
  const res = new ServerResponse(new IncomingMessage(socket))
  let body = ''
  let status = 200
  res.writeHead = vi.fn((code: number) => { status = code; return res })
  res.end = vi.fn((data?: string) => { body = data ?? ''; resolveDone(); return res }) as any
  return { res, getBody: () => body, getStatus: () => status, done }
}

const TX_BODY = {
  transaction_id: '550e8400-e29b-41d4-a716-446655440000',
  transaction_type: 1000,
  card_id: 'card-001',
  processing_code: '00',
  billing_amount: 100.5,
  transaction_amount: 100.0,
  auth_amount: 101.0,
  date_of_transaction: '2025-11-14 15:07:25',
  billing_currency_code: 'SGD',
  transaction_currency_code: 'SGD',
  auth_currency_code: 'SGD',
  card_balance: 500.0,
  merchant_id: 'MERCHANT123',
  merchant_name: 'Example Store',
  merchant_category_code: '5411',
  merchant_city: 'Singapore',
  merchant_country: 'SG',
  terminal_id: 'TERM001',
  pos_entry_mode: '05',
  pos_condition_code: '00',
  pin_entry_capability: '1',
  retrieval_reference_number: '123456789012',
  system_trace_audit_number: '123456',
  acquiring_institution_country_code: 'SG',
  acquiring_institution_id: 'ACQ001',
  wallet_type: 'APPLE',
}

describe('AuthDecisionResource', () => {
  let resource: AuthDecisionResource

  beforeAll(async () => {
    resource = new AuthDecisionResource()
    await resource.configure({
      privateKey: customerKeys.privateKey,
      uqpayPublicKey: uqpayKeys.publicKey,
    })
  })

  it('throws if createHandler called before configure', () => {
    const unconfigured = new AuthDecisionResource()
    expect(() => unconfigured.createHandler({ decide: async () => ({ response_code: '00' }) }))
      .toThrow(/configure/)
  })

  it('handles a full approve flow', async () => {
    const encrypted = await encryptAsUqpay(TX_BODY)
    const req = createRequest(encrypted)
    const { res, getBody, getStatus, done } = createResponse()

    const handler = resource.createHandler({
      decide: async (tx) => {
        expect(tx.transaction_id).toBe('550e8400-e29b-41d4-a716-446655440000')
        expect(tx.billing_amount).toBe(100.5)
        expect(tx.merchant_name).toBe('Example Store')
        return { response_code: '00', partner_reference_id: 'ref-001' }
      },
    })

    handler(req, res)
    await done

    expect(getStatus()).toBe(200)
    const decrypted = await decryptAsUqpay(getBody()) as any
    expect(decrypted.transaction_id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(decrypted.response_code).toBe('00')
    expect(decrypted.partner_reference_id).toBe('ref-001')
  })

  it('auto-injects transaction_id and defaults partner_reference_id', async () => {
    const encrypted = await encryptAsUqpay({ ...TX_BODY, transaction_id: 'tx-auto-inject' })
    const req = createRequest(encrypted)
    const { res, getBody, done } = createResponse()

    const handler = resource.createHandler({
      decide: async () => ({ response_code: '51' }),
    })

    handler(req, res)
    await done

    const decrypted = await decryptAsUqpay(getBody()) as any
    expect(decrypted.transaction_id).toBe('tx-auto-inject')
    expect(decrypted.response_code).toBe('51')
    expect(decrypted.partner_reference_id).toBe('')
  })

  it('calls onError and does NOT respond on decide() exception', async () => {
    const encrypted = await encryptAsUqpay({ ...TX_BODY, transaction_id: 'tx-error-test' })
    const req = createRequest(encrypted)
    const { res } = createResponse()

    const onError = vi.fn()
    const handler = resource.createHandler({
      decide: async () => { throw new Error('business logic crashed') },
      onError,
    })

    handler(req, res)
    // Wait for async handler to finish
    await new Promise((r) => setTimeout(r, 200))

    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].message).toBe('business logic crashed')
    // No response sent — let UQPAY's timeout strategy (delegate or decline) take effect
    expect(res.end).not.toHaveBeenCalled()
  })

  it('calls onError and does NOT respond on PGP decryption failure', async () => {
    const req = createRequest('this is not a PGP message')
    const { res } = createResponse()

    const onError = vi.fn()
    const handler = resource.createHandler({
      decide: async () => ({ response_code: '00' }),
      onError,
    })

    handler(req, res)
    await new Promise((r) => setTimeout(r, 200))

    expect(onError).toHaveBeenCalledOnce()
    expect(res.end).not.toHaveBeenCalled()
  })

  it('calls onError and does NOT respond on invalid JSON after decryption', async () => {
    const invalidJson = 'not valid json {{'
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: invalidJson }),
      encryptionKeys: await openpgp.readKey({ armoredKey: customerKeys.publicKey }),
    }) as string

    const req = createRequest(encrypted)
    const { res } = createResponse()

    const onError = vi.fn()
    const handler = resource.createHandler({
      decide: async () => ({ response_code: '00' }),
      onError,
    })

    handler(req, res)
    await new Promise((r) => setTimeout(r, 200))

    expect(onError).toHaveBeenCalledOnce()
    expect(res.end).not.toHaveBeenCalled()
  })

  it('calls onError and does NOT respond on oversized request body', async () => {
    const readable = new Readable()
    const bigChunk = Buffer.alloc(1_048_577, 'x')
    readable.push(bigChunk)
    readable.push(null)
    Object.assign(readable, {
      headers: { 'content-type': 'application/json; charset=utf-8' },
      method: 'POST',
      url: '/auth-decision',
      destroy: vi.fn(),
    })
    const req = readable as unknown as IncomingMessage

    const { res } = createResponse()

    const onError = vi.fn()
    const handler = resource.createHandler({
      decide: async () => ({ response_code: '00' }),
      onError,
    })

    handler(req, res)
    await new Promise((r) => setTimeout(r, 200))

    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].message).toMatch(/maximum size/)
    expect(res.end).not.toHaveBeenCalled()
  })

  it('configure() accepts file paths (.asc)', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'pgp-test-'))
    const privPath = join(tmpDir, 'private.asc')
    const pubPath = join(tmpDir, 'uqpay.asc')
    writeFileSync(privPath, customerKeys.privateKey)
    writeFileSync(pubPath, uqpayKeys.publicKey)

    const fileResource = new AuthDecisionResource()
    await fileResource.configure({ privateKey: privPath, uqpayPublicKey: pubPath })

    const encrypted = await encryptAsUqpay({ ...TX_BODY, transaction_id: 'tx-file-path' })
    const req = createRequest(encrypted)
    const { res, getBody, done } = createResponse()

    const handler = fileResource.createHandler({
      decide: async () => ({ response_code: '00' }),
    })

    handler(req, res)
    await done

    const decrypted = await decryptAsUqpay(getBody()) as any
    expect(decrypted.transaction_id).toBe('tx-file-path')
    expect(decrypted.response_code).toBe('00')

    rmSync(tmpDir, { recursive: true })
  })

  it('calls onError and does NOT respond when decide() times out', async () => {
    const encrypted = await encryptAsUqpay({ ...TX_BODY, transaction_id: 'tx-timeout' })
    const req = createRequest(encrypted)
    const { res } = createResponse()

    const onError = vi.fn()
    const handler = resource.createHandler({
      decide: () => new Promise(() => {}), // never resolves
      onError,
    })

    handler(req, res)
    // Wait for the 4.5s timeout to fire
    await new Promise((r) => setTimeout(r, 5000))

    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].message).toMatch(/timed out/)
    expect(res.end).not.toHaveBeenCalled()
  }, 10000)
})
