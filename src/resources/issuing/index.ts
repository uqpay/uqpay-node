import type { HttpClient } from '../../http.js'
import { CardsResource } from './cards.js'
import { CardholdersResource } from './cardholders.js'
import { IssuingBalancesResource } from './balances.js'
import { TransactionsResource } from './transactions.js'
import { IssuingTransfersResource } from './transfers.js'
import { ProductsResource } from './products.js'
import { ReportsResource } from './reports.js'
import { AuthDecisionResource } from './auth-decision.js'

export class IssuingResource {
  readonly cards: CardsResource
  readonly cardholders: CardholdersResource
  readonly balances: IssuingBalancesResource
  readonly transactions: TransactionsResource
  readonly transfers: IssuingTransfersResource
  readonly products: ProductsResource
  readonly reports: ReportsResource
  readonly authDecision: AuthDecisionResource

  constructor(http: HttpClient, baseUrl: string) {
    this.cards = new CardsResource(http, baseUrl)
    this.cardholders = new CardholdersResource(http)
    this.balances = new IssuingBalancesResource(http)
    this.transactions = new TransactionsResource(http)
    this.transfers = new IssuingTransfersResource(http)
    this.products = new ProductsResource(http)
    this.reports = new ReportsResource(http)
    this.authDecision = new AuthDecisionResource()
  }
}

export * from './types.js'
