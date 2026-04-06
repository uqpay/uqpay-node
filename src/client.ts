import { TokenManager } from './auth.js'
import { HttpClient, SDK_VERSION } from './http.js'
import { Logger } from './logger.js'
import { WebhookVerifier } from './webhooks.js'
import { AccountResource } from './resources/account/index.js'
import { SupportingResource } from './resources/supporting/index.js'
import { BankingResource } from './resources/banking/index.js'
import { IssuingResource } from './resources/issuing/index.js'
import { PaymentResource } from './resources/payment/index.js'
import { SimulatorResource } from './resources/simulator/index.js'
import type { UQPayClientConfig } from './types/common.js'
import { BASE_URLS, FILE_BASE_URLS } from './types/common.js'

export class UQPayClient {
  private readonly _http: HttpClient
  private readonly _tokenManager: TokenManager

  readonly account: AccountResource
  readonly supporting: SupportingResource
  readonly banking: BankingResource
  readonly issuing: IssuingResource
  readonly payment: PaymentResource
  readonly simulator: SimulatorResource
  readonly webhooks: WebhookVerifier

  // Account context (available after first API call)
  get accountId(): string | undefined { return this._tokenManager.accountContext?.accountId }
  get shortAccountId(): string | undefined { return this._tokenManager.accountContext?.shortAccountId }
  get parentAccountId(): string | undefined { return this._tokenManager.accountContext?.parentAccountId }

  constructor(config: UQPayClientConfig) {
    const environment = config.environment ?? 'sandbox'
    const baseUrl = BASE_URLS[environment]
    const fileBaseUrl = FILE_BASE_URLS[environment]
    const logger = new Logger(config.logLevel ?? 'none', config.redactFields)
    const timeout = config.timeout ?? 30_000

    // Forced init log (ignores logLevel)
    const envLabel = environment === 'production' ? 'PRODUCTION' : 'SANDBOX'
    logger.always(`[UQPAY SDK] Initialized in ${envLabel} mode`)

    if (!config.webhookSecret) {
      logger.always('[UQPAY SDK] Warning: webhookSecret not provided. Calls to client.webhooks.constructEvent() will fail.')
    }

    this._tokenManager = new TokenManager(config.clientId, config.apiKey, baseUrl)

    this._http = new HttpClient(
      baseUrl,
      this._tokenManager,
      logger,
      config.clientId,
      SDK_VERSION,
      timeout,
      globalThis.fetch,
      config.maxRetries ?? 2
    )

    this.account = new AccountResource(this._http)
    this.supporting = new SupportingResource(this._http, fileBaseUrl)
    this.banking = new BankingResource(this._http)
    this.issuing = new IssuingResource(this._http, baseUrl)
    this.payment = new PaymentResource(this._http, config.clientId)
    this.simulator = new SimulatorResource(this._http, baseUrl)
    this.webhooks = new WebhookVerifier(
      config.webhookSecret ?? '',
      { tolerance: 300 }
    )
  }

  /**
   * Escape hatch: make a raw request through the SDK pipeline.
   * Use for endpoints not yet covered by the SDK.
   */
  request<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    path: string,
    options?: { body?: unknown; headers?: Record<string, string>; timeout?: number; maxRetries?: number }
  ): Promise<T> {
    const reqOptions: import('./types/common.js').RequestOptions = {}
    if (options?.headers !== undefined) reqOptions.headers = options.headers
    if (options?.timeout !== undefined) reqOptions.timeout = options.timeout
    if (options?.maxRetries !== undefined) reqOptions.maxRetries = options.maxRetries
    return this._http.request<T>(
      { method, path, body: options?.body },
      reqOptions
    )
  }

  /**
   * Append partner/platform identification to the User-Agent header.
   */
  setAppInfo(name: string, version: string, url?: string): void {
    this._http.setAppInfo(name, version, url)
  }

  /**
   * Release resources (timers, connections).
   */
  close(): void {
    // Native fetch has no persistent connections to clean up.
  }
}
