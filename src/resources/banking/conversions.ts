import { BaseResource } from '../base.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import type {
  CreateQuoteParams, QuoteResponse,
  CreateConversionParams, Conversion, ListConversionsParams,
  ConversionDate, ListConversionDatesParams,
  ExchangeRatesResponse, ListCurrentRatesParams,
} from './types.js'

export class ConversionsResource extends BaseResource {
  createQuote(params: CreateQuoteParams, options?: RequestOptions): Promise<QuoteResponse> {
    return this._post<QuoteResponse>('/v1/conversion/quote', params, options)
  }

  create(params: CreateConversionParams, options?: RequestOptions): Promise<Conversion> {
    return this._post<Conversion>('/v1/conversion', params, options)
  }

  list(params: ListConversionsParams, options?: RequestOptions): Promise<PaginatedResponse<Conversion>> {
    return this._get<PaginatedResponse<Conversion>>(`/v1/conversion${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Conversion> {
    return this._get<Conversion>(`/v1/conversion/${id}`, options)
  }

  listDates(params: ListConversionDatesParams, options?: RequestOptions): Promise<ConversionDate[]> {
    return this._get<ConversionDate[]>(`/v1/conversion/conversion_dates${this._qs(params)}`, options)
  }

  /** Retrieve current exchange rates. GET /v1/exchange/rates */
  listCurrentRates(params?: ListCurrentRatesParams, options?: RequestOptions): Promise<ExchangeRatesResponse> {
    const pairs = params?.currency_pairs
    // Manual URL construction: _qs() serialises arrays as repeated keys (key=a&key=b),
    // but this API expects a single comma-joined value (currency_pairs=SGD%2FUSD%2CUSD%2FSGD).
    const path = pairs && pairs.length > 0
      ? `/v1/exchange/rates?currency_pairs=${encodeURIComponent(pairs.join(','))}`
      : '/v1/exchange/rates'
    return this._get<ExchangeRatesResponse>(path, options)
  }
}
