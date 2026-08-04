import { AccountsResource } from './accounts.js'
import { SubAccountsResource } from './subAccounts.js'
import { AdditionalDocsResource } from './additionalDocs.js'
import { RfisResource } from './rfis.js'
import type { HttpClient } from '../../http.js'

export class AccountResource {
  readonly accounts: AccountsResource
  readonly subAccounts: SubAccountsResource
  readonly additionalDocs: AdditionalDocsResource
  readonly rfis: RfisResource

  constructor(http: HttpClient) {
    this.accounts = new AccountsResource(http)
    this.subAccounts = new SubAccountsResource(http)
    this.additionalDocs = new AdditionalDocsResource(http)
    this.rfis = new RfisResource(http)
  }
}

export * from './types.js'
