import { BaseResource } from '../base.js'
import type { CreateSubAccountParams, CreateSubAccountResponse } from './types.js'
import type { RequestOptions } from '../../types/common.js'

export class SubAccountsResource extends BaseResource {
  /**
   * Create a new sub-account (Banking, Acquiring, or Issuing).
   * POST /v1/accounts/create_accounts
   */
  create(
    params: CreateSubAccountParams,
    options?: RequestOptions
  ): Promise<CreateSubAccountResponse> {
    return this._post<CreateSubAccountResponse>('/v1/accounts/create_accounts', params, options)
  }
}
