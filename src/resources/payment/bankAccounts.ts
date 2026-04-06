import { PaymentBaseResource } from './base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CreateBankAccountParams, UpdateBankAccountParams, BankAccount, ListBankAccountsParams } from './types.js'

export class BankAccountsResource extends PaymentBaseResource {
  create(params: CreateBankAccountParams, options?: RequestOptions): Promise<BankAccount> {
    return this._post<BankAccount>('/v2/payment/bankaccount/create', params, options)
  }

  list(params?: ListBankAccountsParams, options?: RequestOptions): Promise<PaginatedResponse<BankAccount>> {
    return this._get<PaginatedResponse<BankAccount>>(`/v2/payment/bankaccount${params ? this._qs(params) : ''}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<BankAccount> {
    return this._get<BankAccount>(`/v2/payment/bankaccount/${id}`, options)
  }

  update(id: string, params: UpdateBankAccountParams, options?: RequestOptions): Promise<BankAccount> {
    return this._post<BankAccount>(`/v2/payment/bankaccount/${id}`, params, options)
  }
}
