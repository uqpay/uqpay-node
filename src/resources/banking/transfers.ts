import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CreateTransferParams, CreateTransferResponse, Transfer, ListTransfersParams } from './types.js'

export class TransfersResource extends BaseResource {
  create(params: CreateTransferParams, options?: RequestOptions): Promise<CreateTransferResponse> {
    return this._post<CreateTransferResponse>('/v1/transfer', params, options)
  }

  list(params: ListTransfersParams, options?: RequestOptions): Promise<PaginatedResponse<Transfer>> {
    return this._get<PaginatedResponse<Transfer>>(`/v1/transfer${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Transfer> {
    return this._get<Transfer>(`/v1/transfer/${id}`, options)
  }
}
