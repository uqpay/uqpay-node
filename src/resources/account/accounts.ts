import { BaseResource } from '../base.js'
import type {
  CreateAccountParams,
  CreateAccountResponse,
  ListAccountsParams,
  RetrieveAccountResponse,
} from './types.js'
import type { PaginatedResponse, RequestOptions } from '../../types/common.js'

export class AccountsResource extends BaseResource {
  /**
   * Create a Banking account (legacy endpoint — prefer subAccounts.create for new integrations).
   * POST /v1/accounts
   */
  create(params: CreateAccountParams, options?: RequestOptions): Promise<CreateAccountResponse> {
    return this._post<CreateAccountResponse>('/v1/accounts', params, options)
  }

  /**
   * Retrieve a single account by ID.
   * GET /v1/accounts/{id}
   */
  retrieve(id: string, options?: RequestOptions): Promise<RetrieveAccountResponse> {
    return this._get<RetrieveAccountResponse>(`/v1/accounts/${id}`, options)
  }

  /**
   * List all connected accounts.
   * GET /v1/accounts
   */
  list(
    params: ListAccountsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<RetrieveAccountResponse>> {
    return this._get<PaginatedResponse<RetrieveAccountResponse>>(
      `/v1/accounts${this._qs(params)}`,
      options
    )
  }
}
