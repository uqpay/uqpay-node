import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type {
  IssuingBalance, ListIssuingBalancesParams,
  IssuingBalanceTransaction, ListIssuingBalanceTransactionsParams,
} from './types.js'

export class IssuingBalancesResource extends BaseResource {
  list(params: ListIssuingBalancesParams, options?: RequestOptions): Promise<PaginatedResponse<IssuingBalance>> {
    return this._get<PaginatedResponse<IssuingBalance>>(`/v1/issuing/balances${this._qs(params)}`, options)
  }

  /** NOTE: Uses POST with { currency } body — unusual API design. */
  retrieve(currency: string, options?: RequestOptions): Promise<IssuingBalance> {
    return this._post<IssuingBalance>('/v1/issuing/balances', { currency }, options)
  }

  listTransactions(params: ListIssuingBalanceTransactionsParams, options?: RequestOptions): Promise<PaginatedResponse<IssuingBalanceTransaction>> {
    return this._get<PaginatedResponse<IssuingBalanceTransaction>>(`/v1/issuing/balances/transactions${this._qs(params)}`, options)
  }
}
