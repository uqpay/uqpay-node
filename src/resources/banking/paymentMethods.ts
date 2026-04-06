import { BaseResource } from '../base.js'
import type { RequestOptions } from '../../types/common.js'
import type { ListPaymentMethodsParams, PaymentMethod } from './types.js'

export class PaymentMethodsResource extends BaseResource {
  list(params: ListPaymentMethodsParams, options?: RequestOptions): Promise<PaymentMethod[]> {
    return this._get<PaymentMethod[]>(`/v1/beneficiaries/paymentmethods${this._qs(params)}`, options)
  }
}
