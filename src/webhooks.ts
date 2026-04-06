import { createHmac, timingSafeEqual } from 'node:crypto'
import { UQPayWebhookError } from './error.js'
import type { WebhookEventType } from './types/common.js'

// ─── Event types ─────────────────────────────────────────────────────────────

export interface UQPayWebhookEvent {
  version: string
  event_type: WebhookEventType
  event_name: string
  event_id: string
  source_id?: string
  data: unknown
}

// ─── Verifier options ─────────────────────────────────────────────────────────

export interface WebhookOptions {
  /** Timestamp tolerance in seconds. Default: 300 (5 minutes). */
  tolerance?: number
}

// ─── WebhookVerifier ──────────────────────────────────────────────────────────

export class WebhookVerifier {
  private readonly secret: string
  private readonly tolerance: number

  constructor(secret: string, options: WebhookOptions = {}) {
    this.secret = secret
    this.tolerance = options.tolerance ?? 300
  }

  /**
   * Verify the webhook signature and return a typed event.
   *
   * @param rawBody - The original request body as a string or Buffer.
   *   MUST NOT be a parsed object. If using Express, configure:
   *   `app.use(express.raw({ type: 'application/json' }))`
   * @param headers - An object with `x-wk-signature` and `x-wk-timestamp` values.
   */
  constructEvent(
    rawBody: string | Buffer,
    headers: Record<string, string | undefined>
  ): UQPayWebhookEvent {
    // Type guard: reject parsed objects
    if (typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) {
      throw new UQPayWebhookError(
        'rawBody must be the original request body string, not a parsed object. ' +
        'See docs for framework-specific examples (Express: express.raw middleware, ' +
        'Fastify: addContentTypeParser, etc.)'
      )
    }

    const signature = headers['x-wk-signature']
    const timestampStr = headers['x-wk-timestamp']

    if (!signature) {
      throw new UQPayWebhookError('Webhook header missing: x-wk-signature')
    }
    if (!timestampStr) {
      throw new UQPayWebhookError('Webhook header missing: x-wk-timestamp')
    }

    const timestamp = parseInt(timestampStr, 10)
    const now = Math.floor(Date.now() / 1000)
    const diff = Math.abs(now - timestamp)

    if (diff > this.tolerance) {
      const tsIso = new Date(timestamp * 1000).toISOString()
      const nowIso = new Date(now * 1000).toISOString()
      throw new UQPayWebhookError(
        `Webhook timestamp expired: received ${timestamp} (${tsIso}), ` +
        `server time ${now} (${nowIso}), difference ${diff}s exceeds tolerance of ${this.tolerance}s`
      )
    }

    // Compute expected signature: HMAC_SHA512(secret, rawBody + timestamp)
    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody
    const expected = createHmac('sha512', this.secret)
      .update(bodyStr + timestampStr)
      .digest('hex')

    // Timing-safe comparison
    const sigBuf = Buffer.from(signature, 'hex')
    const expBuf = Buffer.from(expected, 'hex')

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new UQPayWebhookError('Webhook signature verification failed: signatures do not match')
    }

    return JSON.parse(bodyStr) as UQPayWebhookEvent
  }
}
