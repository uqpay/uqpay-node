import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { AnswerRfiParams, ListRfisParams, Rfi } from './types.js'

export class RfisResource extends BaseResource {
  list(params: ListRfisParams, options?: RequestOptions): Promise<PaginatedResponse<Rfi>> {
    return this._get<PaginatedResponse<Rfi>>(`/v1/rfis${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Rfi> {
    return this._get<Rfi>(`/v1/rfis/${id}`, options)
  }

  answer(params: AnswerRfiParams, options?: RequestOptions): Promise<Rfi> {
    return this._post<Rfi>('/v1/rfis/answer', params, options)
  }
}
