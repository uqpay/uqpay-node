import { AccountsResource } from './accounts.js'
import { SubAccountsResource } from './subAccounts.js'
import { AdditionalDocsResource } from './additionalDocs.js'
import type { HttpClient } from '../../http.js'

export class AccountResource {
  readonly accounts: AccountsResource
  readonly subAccounts: SubAccountsResource
  readonly additionalDocs: AdditionalDocsResource

  constructor(http: HttpClient) {
    this.accounts = new AccountsResource(http)
    this.subAccounts = new SubAccountsResource(http)
    this.additionalDocs = new AdditionalDocsResource(http)
  }
}

export * from './types.js'
