import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CreateVirtualAccountParams, CreateVirtualAccountResponse, VirtualAccount, ListVirtualAccountsParams } from './types.js'

export class VirtualAccountsResource extends BaseResource {
  create(params: CreateVirtualAccountParams, options?: RequestOptions): Promise<CreateVirtualAccountResponse> {
    return this.http.request<CreateVirtualAccountResponse>({
      method: 'POST',
      path: '/v1/virtual/accounts',
      body: params,
      opaqueIdempotencyKey: true,
    }, options)
  }

  list(params: ListVirtualAccountsParams, options?: RequestOptions): Promise<PaginatedResponse<VirtualAccount>> {
    return this._get<PaginatedResponse<VirtualAccount>>(`/v1/virtual/accounts${this._qs(params)}`, options)
  }
}
