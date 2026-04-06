import type { LogLevel } from './types/common.js'

const BUILT_IN_REDACT = new Set([
  'apiKey', 'api_key', 'auth_token', 'x-auth-token', 'x-api-key',
  'card_number', 'cvc', 'cvv', 'account_number', 'iban',
  'webhook_secret', 'id_number', 'pan', 'pin',
])

function redactObject(obj: unknown, sensitiveKeys: Set<string>): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(v => redactObject(v, sensitiveKeys))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = sensitiveKeys.has(k) ? '****' : redactObject(v, sensitiveKeys)
  }
  return out
}

export class Logger {
  private readonly level: LogLevel
  private readonly sensitiveKeys: Set<string>

  constructor(level: LogLevel, extraRedactFields: string[] = []) {
    this.level = level
    this.sensitiveKeys = new Set([...BUILT_IN_REDACT, ...extraRedactFields])
  }

  info(
    method: string,
    path: string,
    status: number,
    durationMs: number,
    idempotencyKey: string,
    shortAccountId?: string
  ): void {
    if (this.level === 'none') return
    const acct = shortAccountId ? ` [acct: ${shortAccountId}]` : ''
    console.info(
      `[UQPAY] ${method} ${path} → ${status} [idem: ${idempotencyKey}]${acct} (${durationMs}ms)`
    )
  }

  debug(
    method: string,
    path: string,
    status: number,
    durationMs: number,
    idempotencyKey: string,
    shortAccountId: string | undefined,
    retryCount: number,
    requestBody: unknown,
    responseBody: unknown,
    onBehalfOf?: string
  ): void {
    if (this.level !== 'debug') {
      this.info(method, path, status, durationMs, idempotencyKey, shortAccountId)
      return
    }
    const acct = shortAccountId ? ` [acct: ${shortAccountId}]` : ''
    const retry = retryCount > 0 ? ` [retry: ${retryCount}]` : ''
    const behalf = onBehalfOf ? ` [on-behalf: ${onBehalfOf}]` : ''
    const body = requestBody
      ? ` body: ${JSON.stringify(redactObject(requestBody, this.sensitiveKeys)).slice(0, 500)}`
      : ''
    const resp = responseBody
      ? ` resp: ${JSON.stringify(redactObject(responseBody, this.sensitiveKeys)).slice(0, 500)}`
      : ''
    console.debug(
      `[UQPAY] ${method} ${path} → ${status} [idem: ${idempotencyKey}]${acct}${retry}${behalf} (${durationMs}ms)${body}${resp}`
    )
  }

  /** Always logs, regardless of log level (used for init message). */
  always(message: string): void {
    console.info(message)
  }
}
