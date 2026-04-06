import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type {
  CreateCardholderParams, CreateCardholderResponse,
  Cardholder, UpdateCardholderParams, ListCardholdersParams,
} from './types.js'

export class CardholdersResource extends BaseResource {
  create(params: CreateCardholderParams, options?: RequestOptions): Promise<CreateCardholderResponse> {
    return this._post<CreateCardholderResponse>('/v1/issuing/cardholders', params, options)
  }

  list(params: ListCardholdersParams, options?: RequestOptions): Promise<PaginatedResponse<Cardholder>> {
    return this._get<PaginatedResponse<Cardholder>>(`/v1/issuing/cardholders${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Cardholder> {
    return this._get<Cardholder>(`/v1/issuing/cardholders/${id}`, options)
  }

  update(id: string, params: UpdateCardholderParams, options?: RequestOptions): Promise<CreateCardholderResponse> {
    return this._post<CreateCardholderResponse>(`/v1/issuing/cardholders/${id}`, params, options)
  }
}
