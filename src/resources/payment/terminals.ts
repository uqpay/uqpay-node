import { PaymentBaseResource } from './base.js'
import type { RequestOptions } from '../../types/common.js'
import type { GetPinKeyParams, GetPinKeyResponse, RegisterTerminalParams, RegisterTerminalResponse } from './types.js'

export class TerminalsResource extends PaymentBaseResource {
  register(params: RegisterTerminalParams, options?: RequestOptions): Promise<RegisterTerminalResponse> {
    return this._post<RegisterTerminalResponse>('/v2/terminal/register', params, options)
  }

  getPinKey(params: GetPinKeyParams, options?: RequestOptions): Promise<GetPinKeyResponse> {
    return this._post<GetPinKeyResponse>('/v2/terminal/getPinKey', params, options)
  }
}
