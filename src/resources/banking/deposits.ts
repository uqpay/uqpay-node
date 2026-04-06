import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { Deposit, ListDepositsParams } from './types.js'

export class DepositsResource extends BaseResource {
  list(params: ListDepositsParams, options?: RequestOptions): Promise<PaginatedResponse<Deposit>> {
    return this._get<PaginatedResponse<Deposit>>(`/v1/deposit${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Deposit> {
    return this._get<Deposit>(`/v1/deposit/${id}`, options)
  }
}
