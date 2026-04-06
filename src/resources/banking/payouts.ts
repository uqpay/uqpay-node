import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CreatePayoutParams, CreatePayoutResponse, Payout, ListPayoutsParams } from './types.js'

export class PayoutsResource extends BaseResource {
  create(params: CreatePayoutParams, options?: RequestOptions): Promise<CreatePayoutResponse> {
    return this._post<CreatePayoutResponse>('/v1/payouts', params, options)
  }

  list(params: ListPayoutsParams, options?: RequestOptions): Promise<PaginatedResponse<Payout>> {
    return this._get<PaginatedResponse<Payout>>(`/v1/payouts${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Payout> {
    return this._get<Payout>(`/v1/payouts/${id}`, options)
  }
}
