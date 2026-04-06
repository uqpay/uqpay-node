import { PaymentBaseResource } from './base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CreateRefundParams, Refund, ListRefundsParams } from './types.js'

export class RefundsResource extends PaymentBaseResource {
  create(params: CreateRefundParams, options?: RequestOptions): Promise<Refund> {
    return this._post<Refund>('/v2/payment/refunds', params, options)
  }

  list(params?: ListRefundsParams, options?: RequestOptions): Promise<PaginatedResponse<Refund>> {
    return this._get<PaginatedResponse<Refund>>(`/v2/payment/refunds${params ? this._qs(params) : ''}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Refund> {
    return this._get<Refund>(`/v2/payment/refunds/${id}`, options)
  }
}
