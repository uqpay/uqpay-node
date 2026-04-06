import { PaymentBaseResource } from './base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { PaymentAttempt, ListPaymentAttemptsParams } from './types.js'

export class PaymentAttemptsResource extends PaymentBaseResource {
  list(params?: ListPaymentAttemptsParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentAttempt>> {
    return this._get<PaginatedResponse<PaymentAttempt>>(`/v2/payment/payment_attempts${params ? this._qs(params) : ''}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<PaymentAttempt> {
    return this._get<PaymentAttempt>(`/v2/payment/payment_attempts/${id}`, options)
  }
}
