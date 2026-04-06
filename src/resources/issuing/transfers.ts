import { BaseResource } from '../base.js'
import type { RequestOptions } from '../../types/common.js'
import type { CreateIssuingTransferParams, CreateIssuingTransferResponse, IssuingTransfer } from './types.js'

export class IssuingTransfersResource extends BaseResource {
  create(params: CreateIssuingTransferParams, options?: RequestOptions): Promise<CreateIssuingTransferResponse> {
    return this._post<CreateIssuingTransferResponse>('/v1/issuing/transfers', params, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<IssuingTransfer> {
    return this._get<IssuingTransfer>(`/v1/issuing/transfers/${id}`, options)
  }
}
