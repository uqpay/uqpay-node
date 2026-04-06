import { BaseResource } from '../base.js'
import type { HttpClient } from '../../http.js'
import type { RequestOptions, PaginatedResponse } from '../../types/common.js'
import { IFRAME_BASE_URLS } from '../../types/common.js'
import type {
  CreateCardParams, CreateCardResponse, Card, ListCardsParams,
  SecureCardDetails, UpdateCardParams, UpdateCardStatusParams, UpdateCardStatusResponse,
  ActivateCardParams, ActivateCardResponse, AssignCardParams,
  PanTokenResponse, SecureIframeOptions, SecureIframeResult,
  CardRechargeWithdrawParams, CardRechargeWithdrawResponse,
} from './types.js'

export class CardsResource extends BaseResource {
  private readonly iframeBaseUrl: string

  constructor(http: HttpClient, baseUrl: string) {
    super(http)
    this.iframeBaseUrl = baseUrl.includes('sandbox')
      ? IFRAME_BASE_URLS.sandbox
      : IFRAME_BASE_URLS.production
  }
  create(params: CreateCardParams, options?: RequestOptions): Promise<CreateCardResponse> {
    return this._post<CreateCardResponse>('/v1/issuing/cards', params, options)
  }

  list(params: ListCardsParams, options?: RequestOptions): Promise<PaginatedResponse<Card>> {
    return this._get<PaginatedResponse<Card>>(`/v1/issuing/cards${this._qs(params)}`, options)
  }

  retrieve(id: string, options?: RequestOptions): Promise<Card> {
    return this._get<Card>(`/v1/issuing/cards/${id}`, options)
  }

  retrieveSecure(id: string, options?: RequestOptions): Promise<SecureCardDetails> {
    return this._get<SecureCardDetails>(`/v1/issuing/cards/${id}/secure`, options)
  }

  update(id: string, params: UpdateCardParams, options?: RequestOptions): Promise<CreateCardResponse> {
    return this._post<CreateCardResponse>(`/v1/issuing/cards/${id}`, params, options)
  }

  updateStatus(id: string, params: UpdateCardStatusParams, options?: RequestOptions): Promise<UpdateCardStatusResponse> {
    return this._post<UpdateCardStatusResponse>(`/v1/issuing/cards/${id}/status`, params, options)
  }

  activate(params: ActivateCardParams, options?: RequestOptions): Promise<ActivateCardResponse> {
    return this._post<ActivateCardResponse>('/v1/issuing/cards/activate', params, options)
  }

  assign(params: AssignCardParams, options?: RequestOptions): Promise<CreateCardResponse> {
    return this._post<CreateCardResponse>('/v1/issuing/cards/assign', params, options)
  }

  createPanToken(id: string, options?: RequestOptions): Promise<PanTokenResponse> {
    return this._post<PanTokenResponse>(`/v1/issuing/cards/${id}/token`, {}, options)
  }

  async getSecureIframeUrl(id: string, opts?: SecureIframeOptions, options?: RequestOptions): Promise<SecureIframeResult> {
    const { token, expires_at, expires_in } = await this.createPanToken(id, options)
    const params = new URLSearchParams({ token, cardId: id })
    if (opts?.lang) params.set('lang', opts.lang)
    if (opts?.styles) params.set('styles', encodeURIComponent(JSON.stringify(opts.styles)))
    const iframeUrl = `${this.iframeBaseUrl}/iframe/card?${params.toString()}`
    return { iframeUrl, token, expires_at, expires_in }
  }

  recharge(id: string, params: CardRechargeWithdrawParams, options?: RequestOptions): Promise<CardRechargeWithdrawResponse> {
    return this._post<CardRechargeWithdrawResponse>(`/v1/issuing/cards/${id}/recharge`, params, options)
  }

  withdraw(id: string, params: CardRechargeWithdrawParams, options?: RequestOptions): Promise<CardRechargeWithdrawResponse> {
    return this._post<CardRechargeWithdrawResponse>(`/v1/issuing/cards/${id}/withdraw`, params, options)
  }
}
