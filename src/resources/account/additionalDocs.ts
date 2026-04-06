import { BaseResource } from '../base.js'
import type { GetAdditionalDocsParams, AdditionalDocument } from './types.js'
import type { RequestOptions } from '../../types/common.js'

export class AdditionalDocsResource extends BaseResource {
  /**
   * Get the list of required and optional documents for a given country and business type.
   * GET /v1/accounts/get_additional
   */
  get(params: GetAdditionalDocsParams, options?: RequestOptions): Promise<AdditionalDocument[]> {
    return this._get<AdditionalDocument[]>(`/v1/accounts/get_additional${this._qs(params)}`, options)
  }
}
