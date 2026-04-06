import { PaymentBaseResource } from './base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CreatePaymentPayoutParams, PaymentPayout, ListPaymentPayoutsParams } from './types.js'

export class PaymentPayoutsResource extends PaymentBaseResource {
  create(params: CreatePaymentPayoutParams, options?: RequestOptions): Promise<PaymentPayout> {
    return this._post<PaymentPayout>('/v2/payment/payout/create', params, options)
  }

  list(params?: ListPaymentPayoutsParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentPayout>> {
    return this._get<PaginatedResponse<PaymentPayout>>(`/v2/payment/payout${params ? this._qs(params) : ''}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<PaymentPayout> {
    return this._get<PaymentPayout>(`/v2/payment/payout/${id}`, options)
  }
}
