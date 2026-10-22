import { PaymentBaseResource } from './base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type {
  CreatePaymentIntentParams, UpdatePaymentIntentParams,
  ConfirmPaymentIntentParams, CapturePaymentIntentParams, CancelPaymentIntentParams,
  PaymentIntent, PaymentIntentCaptureResponse, ListPaymentIntentsParams,
} from './types.js'

export class PaymentIntentsResource extends PaymentBaseResource {
  create(params: CreatePaymentIntentParams, options?: RequestOptions): Promise<PaymentIntent> {
    return this._post<PaymentIntent>('/v2/payment_intents/create', params, options)
  }

  list(params?: ListPaymentIntentsParams, options?: RequestOptions): Promise<PaginatedResponse<PaymentIntent>> {
    if (!params) return this._get<PaginatedResponse<PaymentIntent>>('/v2/payment_intents', options)
    const { intent_status, create_start_time, create_end_time, ...query } = params
    return this._get<PaginatedResponse<PaymentIntent>>(`/v2/payment_intents${this._qs({
      ...query,
      payment_intent_status: query.payment_intent_status !== undefined ? query.payment_intent_status : intent_status,
      start_time: query.start_time !== undefined ? query.start_time : create_start_time,
      end_time: query.end_time !== undefined ? query.end_time : create_end_time,
    })}`, options)
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

  capture(id: string, params?: CapturePaymentIntentParams, options?: RequestOptions): Promise<PaymentIntentCaptureResponse> {
    return this._post<PaymentIntentCaptureResponse>(`/v2/payment_intents/${id}/capture`, params ?? {}, options)
  }

  cancel(id: string, params?: CancelPaymentIntentParams, options?: RequestOptions): Promise<PaymentIntent> {
    return this._post<PaymentIntent>(`/v2/payment_intents/${id}/cancel`, params ?? {}, options)
  }
}
