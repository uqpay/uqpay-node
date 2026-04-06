import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CreateVirtualAccountParams, CreateVirtualAccountResponse, VirtualAccount, ListVirtualAccountsParams } from './types.js'

export class VirtualAccountsResource extends BaseResource {
  create(params: CreateVirtualAccountParams, options?: RequestOptions): Promise<CreateVirtualAccountResponse> {
    return this._post<CreateVirtualAccountResponse>('/v1/virtual/accounts', params, options)
  }

  list(params: ListVirtualAccountsParams, options?: RequestOptions): Promise<PaginatedResponse<VirtualAccount>> {
    return this._get<PaginatedResponse<VirtualAccount>>(`/v1/virtual/accounts${this._qs(params)}`, options)
  }
}
