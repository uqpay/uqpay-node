import { BaseResource } from '../base.js'
import type { PaginatedResponse, RequestOptions } from '../../types/common.js'
import type { ListMerchantBrandsParams, MerchantBrand } from './types.js'

export class MerchantBrandsResource extends BaseResource {
  list(params: ListMerchantBrandsParams, options?: RequestOptions): Promise<PaginatedResponse<MerchantBrand>> {
    return this._get<PaginatedResponse<MerchantBrand>>(`/v1/issuing/merchant_brands${this._qs(params)}`, options)
  }
}
