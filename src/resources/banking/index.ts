import type { HttpClient } from '../../http.js'
import { BalancesResource } from './balances.js'
import { DepositsResource } from './deposits.js'
import { TransfersResource } from './transfers.js'
import { PayoutsResource } from './payouts.js'
import { BeneficiariesResource } from './beneficiaries.js'
import { ConversionsResource } from './conversions.js'
import { VirtualAccountsResource } from './virtualAccounts.js'
import { PaymentMethodsResource } from './paymentMethods.js'

export class BankingResource {
  readonly balances: BalancesResource
  readonly deposits: DepositsResource
  readonly transfers: TransfersResource
  readonly payouts: PayoutsResource
  readonly beneficiaries: BeneficiariesResource
  readonly conversions: ConversionsResource
  readonly virtualAccounts: VirtualAccountsResource
  readonly paymentMethods: PaymentMethodsResource

  constructor(http: HttpClient) {
    this.balances = new BalancesResource(http)
    this.deposits = new DepositsResource(http)
    this.transfers = new TransfersResource(http)
    this.payouts = new PayoutsResource(http)
    this.beneficiaries = new BeneficiariesResource(http)
    this.conversions = new ConversionsResource(http)
    this.virtualAccounts = new VirtualAccountsResource(http)
    this.paymentMethods = new PaymentMethodsResource(http)
  }
}

export * from './types.js'
