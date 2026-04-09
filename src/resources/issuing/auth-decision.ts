import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { PgpContext } from '../../crypto/pgp.js'
import type {
  AuthDecisionConfig,
  AuthDecisionHandlerOptions,
  AuthDecisionTransaction,
} from './types.js'

/** Maximum request body size (1 MB). PGP-armored transaction payloads are well under 100 KB. */
const MAX_BODY_BYTES = 1_048_576

/** UQPAY enforces a 5-second timeout. We use 4.5s to leave buffer for encryption + network. */
const DECIDE_TIMEOUT_MS = 4500

const KEY_FILE_EXTENSIONS = /\.(asc|pgp|gpg)$/i

/** If value looks like a file path (.asc/.pgp/.gpg), read it; otherwise return as-is. */
function resolveKey(value: string): string {
  if (KEY_FILE_EXTENSIONS.test(value)) {
    return readFileSync(value, 'utf8')
  }
  return value
}

export class AuthDecisionResource {
  private pgpContext: PgpContext | undefined

  async configure(config: AuthDecisionConfig): Promise<void> {
    const pgpConfig: Parameters<typeof PgpContext.create>[0] = {
      privateKey: resolveKey(config.privateKey),
      uqpayPublicKey: resolveKey(config.uqpayPublicKey),
    }
    if (config.passphrase !== undefined) {
      pgpConfig.passphrase = config.passphrase
    }
    this.pgpContext = await PgpContext.create(pgpConfig)
  }

  createHandler(
    options: AuthDecisionHandlerOptions
  ): (req: IncomingMessage, res: ServerResponse) => void {
    if (!this.pgpContext) {
      throw new Error(
        'AuthDecision not configured. Call client.issuing.authDecision.configure() first.'
      )
    }

    const pgp = this.pgpContext

    return (req: IncomingMessage, res: ServerResponse) => {
      void this.handleRequest(pgp, options, req, res)
    }
  }

  private async handleRequest(
    pgp: PgpContext,
    options: AuthDecisionHandlerOptions,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    let transactionId = ''

    try {
      const rawBody = await readBody(req)
      const plaintext = await pgp.decrypt(rawBody)
      const transaction: AuthDecisionTransaction = JSON.parse(plaintext)
      transactionId = transaction.transaction_id

      // Race decide() against timeout to ensure we respond before UQPAY's 5s deadline
      let timer: ReturnType<typeof setTimeout>
      const result = await Promise.race([
        Promise.resolve(options.decide(transaction)).finally(() => clearTimeout(timer)),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('Authorization decision timed out (4.5s)')), DECIDE_TIMEOUT_MS)
        }),
      ])

      const response = JSON.stringify({
        transaction_id: transactionId,
        response_code: result.response_code,
        partner_reference_id: result.partner_reference_id ?? '',
      })

      const encrypted = await pgp.encrypt(response)
      // UQPAY sends requests with application/json despite PGP-armored body; match their convention
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(encrypted)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      options.onError?.(error)
      // Do NOT send a response — let UQPAY's configured timeout strategy (delegate or decline) take effect.
      // Sending a decline here would override the customer's timeout policy.
    }
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0
    let settled = false
    req.on('data', (chunk: Buffer) => {
      if (settled) return
      totalBytes += chunk.length
      if (totalBytes > MAX_BODY_BYTES) {
        settled = true
        req.destroy()
        reject(new Error(`Request body exceeds maximum size of ${MAX_BODY_BYTES} bytes`))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => { if (!settled) resolve(Buffer.concat(chunks).toString('utf8')) })
    req.on('error', (err) => { if (!settled) { settled = true; reject(err) } })
  })
}
