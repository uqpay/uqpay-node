import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { Balance, ListBalancesParams, BalanceTransaction, ListBalanceTransactionsParams } from './types.js'

export class BalancesResource extends BaseResource {
  list(params: ListBalancesParams, options?: RequestOptions): Promise<PaginatedResponse<Balance>> {
    return this._get<PaginatedResponse<Balance>>(`/v1/balances${this._qs(params)}`, options)
  }

  retrieve(currency: string, options?: RequestOptions): Promise<Balance> {
    return this._get<Balance>(`/v1/balances/${currency}`, options)
  }

  listTransactions(params: ListBalanceTransactionsParams, options?: RequestOptions): Promise<PaginatedResponse<BalanceTransaction>> {
    return this._get<PaginatedResponse<BalanceTransaction>>(`/v1/balances/transactions${this._qs(params)}`, options)
  }
}
