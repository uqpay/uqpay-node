import type { HttpClient } from '../../http.js'
import { PaymentIntentsResource } from './paymentIntents.js'
import { RefundsResource } from './refunds.js'
import { PaymentPayoutsResource } from './payouts.js'
import { BankAccountsResource } from './bankAccounts.js'
import { PaymentBalancesResource } from './balances.js'
import { PaymentAttemptsResource } from './paymentAttempts.js'
import { SettlementsResource } from './settlements.js'

export class PaymentResource {
  readonly paymentIntents: PaymentIntentsResource
  readonly refunds: RefundsResource
  readonly payouts: PaymentPayoutsResource
  readonly bankAccounts: BankAccountsResource
  readonly balances: PaymentBalancesResource
  readonly paymentAttempts: PaymentAttemptsResource
  readonly settlements: SettlementsResource

  constructor(http: HttpClient, clientId: string) {
    this.paymentIntents = new PaymentIntentsResource(http, clientId)
    this.refunds = new RefundsResource(http, clientId)
    this.payouts = new PaymentPayoutsResource(http, clientId)
    this.bankAccounts = new BankAccountsResource(http, clientId)
    this.balances = new PaymentBalancesResource(http, clientId)
    this.paymentAttempts = new PaymentAttemptsResource(http, clientId)
    this.settlements = new SettlementsResource(http, clientId)
  }
}

export * from './types.js'
