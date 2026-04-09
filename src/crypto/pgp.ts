import * as openpgp from 'openpgp'

// ─── Key Generation ──────────────────────────────────────────────────────────

export interface AuthDecisionKeyPairOptions {
  name: string
  email: string
}

export interface AuthDecisionKeyPair {
  publicKey: string
  privateKey: string
}

export async function generateAuthDecisionKeyPair(
  options: AuthDecisionKeyPairOptions
): Promise<AuthDecisionKeyPair> {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: 'rsa',
    rsaBits: 2048,
    userIDs: [{ name: options.name, email: options.email }],
    format: 'armored',
  })
  return { publicKey, privateKey }
}

// ─── PGP Context (encrypt/decrypt) ──────────────────────────────────────────

export interface PgpContextConfig {
  privateKey: string
  uqpayPublicKey: string
  passphrase?: string
}

export class PgpContext {
  private constructor(
    private readonly decryptionKey: openpgp.PrivateKey,
    private readonly encryptionKey: openpgp.Key,
  ) {}

  static async create(config: PgpContextConfig): Promise<PgpContext> {
    let privKey = await openpgp.readPrivateKey({ armoredKey: config.privateKey })
    if (config.passphrase) {
      privKey = await openpgp.decryptKey({ privateKey: privKey, passphrase: config.passphrase })
    }
    const pubKey = await openpgp.readKey({ armoredKey: config.uqpayPublicKey })
    return new PgpContext(privKey, pubKey)
  }

  async decrypt(ciphertext: string): Promise<string> {
    const message = await openpgp.readMessage({ armoredMessage: ciphertext })
    const { data } = await openpgp.decrypt({
      message,
      decryptionKeys: this.decryptionKey,
    })
    return data as string
  }

  async encrypt(plaintext: string): Promise<string> {
    const message = await openpgp.createMessage({ text: plaintext })
    const encrypted = await openpgp.encrypt({
      message,
      encryptionKeys: this.encryptionKey,
    })
    return encrypted as string
  }
}
