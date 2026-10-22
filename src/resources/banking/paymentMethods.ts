import { BaseResource } from '../base.js'
import type { RequestOptions } from '../../types/common.js'
import type { ListPaymentMethodsParams, ListPaymentMethodsResponse } from './types.js'

export class PaymentMethodsResource extends BaseResource {
  list(params: ListPaymentMethodsParams, options?: RequestOptions): Promise<ListPaymentMethodsResponse> {
    return this._get<ListPaymentMethodsResponse>(`/v1/beneficiaries/paymentmethods${this._qs(params)}`, options)
  }
}
