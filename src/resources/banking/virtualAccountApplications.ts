import { BaseResource } from '../base.js'
import type { RequestOptions } from '../../types/common.js'
import type {
  ListVirtualAccountApplicationsParams,
  ListVirtualAccountApplicationsResponse,
  RetrieveVirtualAccountApplicationResponse,
} from './types.js'

/** Application tracking is separate from issued Virtual Account bank details. */
export class VirtualAccountApplicationsResource extends BaseResource {
  list(
    params: ListVirtualAccountApplicationsParams,
    options?: RequestOptions
  ): Promise<ListVirtualAccountApplicationsResponse> {
    return this._get<ListVirtualAccountApplicationsResponse>(
      `/v1/virtual/applications${this._qs(params)}`,
      options
    )
  }

  retrieve(
    applicationId: string,
    options?: RequestOptions
  ): Promise<RetrieveVirtualAccountApplicationResponse> {
    return this._get<RetrieveVirtualAccountApplicationResponse>(
      `/v1/virtual/applications/${encodeURIComponent(applicationId)}`,
      options
    )
  }
}
