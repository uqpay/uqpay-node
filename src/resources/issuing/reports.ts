import { BaseResource } from '../base.js'
import type { RequestOptions } from '../../types/common.js'
import type { CreateReportParams, CreateReportResponse } from './types.js'

export class ReportsResource extends BaseResource {
  create(params: CreateReportParams, options?: RequestOptions): Promise<CreateReportResponse> {
    return this._post<CreateReportResponse>('/v1/issuing/reports', params, options)
  }

  /** Download report as binary. Returns ArrayBuffer (or string until http.ts adds binary support). */
  download(id: string, options?: RequestOptions): Promise<ArrayBuffer> {
    return this._get<ArrayBuffer>(`/v1/issuing/reports/${id}`, options)
  }
}
