import { PaymentBaseResource } from './base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { PaymentBalance, ListPaymentBalancesParams } from './types.js'

export class PaymentBalancesResource extends PaymentBaseResource {
  list(params?: ListPaymentBalancesParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentBalance>> {
    return this._get<PaginatedResponse<PaymentBalance>>(`/v2/payment/balances${params ? this._qs(params) : ''}`, options)
  }

  retrieve(currency: string, options?: RequestOptions): Promise<PaymentBalance> {
    return this._get<PaymentBalance>(`/v2/payment/balances/${currency}`, options)
  }
}
