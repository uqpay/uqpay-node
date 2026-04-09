import { describe, it, expect, beforeAll } from 'vitest'
import * as openpgp from 'openpgp'
import { generateAuthDecisionKeyPair, PgpContext } from '../../src/crypto/pgp.js'

describe('generateAuthDecisionKeyPair', () => {
  it('generates an RSA 2048-bit key pair with encryption subkey', async () => {
    const { publicKey, privateKey } = await generateAuthDecisionKeyPair({
      name: 'Test Corp',
      email: 'test@example.com',
    })

    expect(publicKey).toContain('-----BEGIN PGP PUBLIC KEY BLOCK-----')
    expect(privateKey).toContain('-----BEGIN PGP PRIVATE KEY BLOCK-----')
  }, 15000)

  it('generates keys that can be read back by openpgp', async () => {
    const { publicKey, privateKey } = await generateAuthDecisionKeyPair({
      name: 'Test Corp',
      email: 'test@example.com',
    })

    const pubKey = await openpgp.readKey({ armoredKey: publicKey })
    const privKey = await openpgp.readPrivateKey({ armoredKey: privateKey })

    const encKeys = pubKey.getEncryptionKey()
    expect(encKeys).toBeDefined()
    expect(privKey.getKeys()).toHaveLength(2) // primary + subkey
  }, 15000)
})

describe('PgpContext', () => {
  let customerPublic: string
  let customerPrivate: string
  let uqpayPublic: string
  let uqpayPrivate: string

  beforeAll(async () => {
    const customer = await generateAuthDecisionKeyPair({ name: 'Customer', email: 'c@test.com' })
    customerPublic = customer.publicKey
    customerPrivate = customer.privateKey

    const uqpay = await generateAuthDecisionKeyPair({ name: 'UQPAY', email: 'u@test.com' })
    uqpayPublic = uqpay.publicKey
    uqpayPrivate = uqpay.privateKey
  }, 30000)

  it('decrypts a message encrypted with the customer public key', async () => {
    const plaintext = JSON.stringify({ transaction_id: 'tx-123', billing_amount: 100 })
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: plaintext }),
      encryptionKeys: await openpgp.readKey({ armoredKey: customerPublic }),
    })

    const ctx = await PgpContext.create({
      privateKey: customerPrivate,
      uqpayPublicKey: uqpayPublic,
    })
    const decrypted = await ctx.decrypt(encrypted as string)
    expect(decrypted).toBe(plaintext)
  })

  it('encrypts a message that can be decrypted with UQPAY private key', async () => {
    const ctx = await PgpContext.create({
      privateKey: customerPrivate,
      uqpayPublicKey: uqpayPublic,
    })

    const plaintext = JSON.stringify({ transaction_id: 'tx-123', response_code: '00' })
    const encrypted = await ctx.encrypt(plaintext)

    const message = await openpgp.readMessage({ armoredMessage: encrypted })
    const { data } = await openpgp.decrypt({
      message,
      decryptionKeys: await openpgp.readPrivateKey({ armoredKey: uqpayPrivate }),
    })
    expect(data).toBe(plaintext)
  })

  it('decrypts a message with passphrase-protected private key', async () => {
    const passphrase = 'test-passphrase-123'
    const { privateKey: rawPriv, publicKey: rawPub } = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: 2048,
      userIDs: [{ name: 'Protected', email: 'p@test.com' }],
      passphrase,
      format: 'armored',
    })

    const plaintext = '{"test": true}'
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: plaintext }),
      encryptionKeys: await openpgp.readKey({ armoredKey: rawPub }),
    })

    const ctx = await PgpContext.create({
      privateKey: rawPriv,
      uqpayPublicKey: uqpayPublic,
      passphrase,
    })
    const decrypted = await ctx.decrypt(encrypted as string)
    expect(decrypted).toBe(plaintext)
  }, 20000)

  it('throws on invalid private key', async () => {
    await expect(
      PgpContext.create({
        privateKey: 'not-a-key',
        uqpayPublicKey: uqpayPublic,
      })
    ).rejects.toThrow()
  })

  it('throws on invalid UQPAY public key', async () => {
    await expect(
      PgpContext.create({
        privateKey: customerPrivate,
        uqpayPublicKey: 'not-a-key',
      })
    ).rejects.toThrow()
  })
})
