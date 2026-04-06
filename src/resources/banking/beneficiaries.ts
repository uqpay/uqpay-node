import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type {
  CreateBeneficiaryParams, CreateBeneficiaryResponse,
  Beneficiary, ListBeneficiariesParams, CheckBeneficiaryParams
} from './types.js'

export class BeneficiariesResource extends BaseResource {
  create(params: CreateBeneficiaryParams, options?: RequestOptions): Promise<CreateBeneficiaryResponse> {
    return this._post<CreateBeneficiaryResponse>('/v1/beneficiaries', params, options)
  }

  list(params: ListBeneficiariesParams, options?: RequestOptions): Promise<PaginatedResponse<Beneficiary>> {
    return this._get<PaginatedResponse<Beneficiary>>(`/v1/beneficiaries${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Beneficiary> {
    return this._get<Beneficiary>(`/v1/beneficiaries/${id}`, options)
  }

  update(id: string, params: Partial<CreateBeneficiaryParams>, options?: RequestOptions): Promise<CreateBeneficiaryResponse> {
    return this._post<CreateBeneficiaryResponse>(`/v1/beneficiaries/${id}`, params, options)
  }

  delete(id: string, options?: RequestOptions): Promise<Record<string, never>> {
    return this._post<Record<string, never>>(`/v1/beneficiaries/${id}/delete`, {}, options)
  }

  check(params: CheckBeneficiaryParams, options?: RequestOptions): Promise<Beneficiary> {
    return this._post<Beneficiary>('/v1/beneficiaries/check', params, options)
  }
}
