import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CardTransaction, ClaimUnsolicitedRefundParams, ClaimUnsolicitedRefundResponse, ListCardTransactionsParams } from './types.js'

export class TransactionsResource extends BaseResource {
  list(params: ListCardTransactionsParams, options?: RequestOptions): Promise<PaginatedResponse<CardTransaction>> {
    return this._get<PaginatedResponse<CardTransaction>>(`/v1/issuing/transactions${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<CardTransaction> {
    return this._get<CardTransaction>(`/v1/issuing/transactions/${id}`, options)
  }

  claimUnsolicitedRefund(params: ClaimUnsolicitedRefundParams, options?: RequestOptions): Promise<ClaimUnsolicitedRefundResponse> {
    return this._post<ClaimUnsolicitedRefundResponse>('/v1/issuing/transactions/unsolicited_refund/release', params, options)
  }
}
