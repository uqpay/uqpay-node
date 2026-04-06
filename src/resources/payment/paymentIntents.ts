import { PaymentBaseResource } from './base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type {
  CreatePaymentIntentParams, UpdatePaymentIntentParams,
  ConfirmPaymentIntentParams, CapturePaymentIntentParams, CancelPaymentIntentParams,
  PaymentIntent, ListPaymentIntentsParams,
} from './types.js'

export class PaymentIntentsResource extends PaymentBaseResource {
  create(params: CreatePaymentIntentParams, options?: RequestOptions): Promise<PaymentIntent> {
    return this._post<PaymentIntent>('/v2/payment_intents/create', params, options)
  }

  list(params?: ListPaymentIntentsParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentIntent>> {
    return this._get<PaginatedResponse<PaymentIntent>>(`/v2/payment_intents${params ? this._qs(params) : ''}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<PaymentIntent> {
    return this._get<PaymentIntent>(`/v2/payment_intents/${id}`, options)
  }

  update(id: string, params: UpdatePaymentIntentParams, options?: RequestOptions): Promise<PaymentIntent> {
    return this._post<PaymentIntent>(`/v2/payment_intents/${id}`, params, options)
  }

  confirm(id: string, params?: ConfirmPaymentIntentParams, options?: RequestOptions): Promise<PaymentIntent> {
    return this._post<PaymentIntent>(`/v2/payment_intents/${id}/confirm`, params ?? {}, options)
  }

  capture(id: string, params?: CapturePaymentIntentParams, options?: RequestOptions): Promise<PaymentIntent> {
    return this._post<PaymentIntent>(`/v2/payment_intents/${id}/capture`, params ?? {}, options)
  }

  cancel(id: string, params?: CancelPaymentIntentParams, options?: RequestOptions): Promise<PaymentIntent> {
    return this._post<PaymentIntent>(`/v2/payment_intents/${id}/cancel`, params ?? {}, options)
  }
}
