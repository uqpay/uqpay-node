import { PaymentBaseResource } from './base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { Settlement, ListSettlementsParams } from './types.js'

export class SettlementsResource extends PaymentBaseResource {
  list(params?: ListSettlementsParams, options?: RequestOptions): Promise<PaginatedResponse<Settlement>> {
    return this._get<PaginatedResponse<Settlement>>(`/v2/payment/settlements${params ? this._qs(params) : ''}`, options)
  }
}
