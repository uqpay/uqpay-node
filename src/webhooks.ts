import { createHmac, timingSafeEqual } from 'node:crypto'
import { UQPayWebhookError } from './error.js'
import type { WebhookEventName, WebhookEventType } from './types/common.js'
import type { VirtualAccountApplication } from './resources/banking/types.js'

// ─── Event types ─────────────────────────────────────────────────────────────

export interface UQPayWebhookEvent<TData = unknown> {
  version: string
  event_type: WebhookEventType
  event_name: WebhookEventName
  event_id: string
  source_id?: string
  data: TData
}

export type VirtualAccountApplicationWebhookVersion = 'V1.5.1' | 'V1.5.2' | 'V1.6.0'

/**
 * Application webhook data with restored routing fields. The SDK exposes these
 * fields here while their REST public contract remains pending.
 */
export interface VirtualAccountApplicationWebhookData extends VirtualAccountApplication {
  /** UUID of the account that owns the Virtual Account application. */
  account_id: string
  /**
   * Routing context from Webhook Hub. The value is "0" for a main account and
   * the owning main account ID for a connected account. This is an ordinary
   * string and must not be parsed or validated as a UUID.
   */
  direct_id: string
}

type VirtualAccountApplicationWebhookEnvelope<
  TEventType extends 'virtual.account.create' | 'virtual.account.update' | 'virtual.account.closed',
  TData,
> = UQPayWebhookEvent<TData> & {
  version: VirtualAccountApplicationWebhookVersion
  event_name: 'VIRTUAL'
  event_type: TEventType
  source_id: string
}

export type VirtualAccountApplicationCreatedWebhookEvent =
  VirtualAccountApplicationWebhookEnvelope<'virtual.account.create', VirtualAccountApplicationWebhookData>

export type VirtualAccountApplicationUpdatedWebhookEvent =
  VirtualAccountApplicationWebhookEnvelope<'virtual.account.update', VirtualAccountApplicationWebhookData>

export type VirtualAccountApplicationClosedWebhookEvent =
  VirtualAccountApplicationWebhookEnvelope<'virtual.account.closed', VirtualAccountApplicationWebhookData>

export type VirtualAccountApplicationWebhookEvent =
  | VirtualAccountApplicationCreatedWebhookEvent
  | VirtualAccountApplicationUpdatedWebhookEvent
  | VirtualAccountApplicationClosedWebhookEvent

/**
 * Compatibility type for archived deliveries produced before account_id and
 * direct_id were restored to the Hub payload. New deliveries should use
 * VirtualAccountApplicationWebhookEvent.
 */
export type LegacyVirtualAccountApplicationWebhookEvent =
  | VirtualAccountApplicationWebhookEnvelope<'virtual.account.create', VirtualAccountApplication>
  | VirtualAccountApplicationWebhookEnvelope<'virtual.account.update', VirtualAccountApplication>
  | VirtualAccountApplicationWebhookEnvelope<'virtual.account.closed', VirtualAccountApplication>

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
  constructEvent<TEvent extends UQPayWebhookEvent = UQPayWebhookEvent>(
    rawBody: string | Buffer,
    headers: Record<string, string | undefined>
  ): TEvent {
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
    const timestampSeconds = timestamp >= 1_000_000_000_000
      ? Math.floor(timestamp / 1000)
      : timestamp
    const now = Math.floor(Date.now() / 1000)
    const diff = Math.abs(now - timestampSeconds)

    if (diff > this.tolerance) {
      const tsIso = new Date(timestampSeconds * 1000).toISOString()
      const nowIso = new Date(now * 1000).toISOString()
      throw new UQPayWebhookError(
        `Webhook timestamp expired: received ${timestampStr} (${tsIso}), ` +
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

    return JSON.parse(bodyStr) as TEvent
  }
}
