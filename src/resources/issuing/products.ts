import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type { CardProduct, ListProductsParams } from './types.js'

export class ProductsResource extends BaseResource {
  list(params: ListProductsParams, options?: RequestOptions): Promise<PaginatedResponse<CardProduct>> {
    return this._get<PaginatedResponse<CardProduct>>(`/v1/issuing/products${this._qs(params)}`, options)
  }
}
