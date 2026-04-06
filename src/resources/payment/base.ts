import { BaseResource } from '../base.js'
import type { HttpClient } from '../../http.js'
import type { RequestOptions } from '../../types/common.js'

export abstract class PaymentBaseResource extends BaseResource {
  constructor(http: HttpClient, private readonly clientId: string) {
    super(http)
  }

  private _withClientId(options?: RequestOptions): RequestOptions {
    return {
      ...options,
      headers: { ...options?.headers, 'x-client-id': this.clientId },
    }
  }

  protected override _get<T>(path: string, options?: RequestOptions): Promise<T> {
    return super._get<T>(path, this._withClientId(options))
  }

  protected override _post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return super._post<T>(path, body, this._withClientId(options))
  }

  protected override _patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return super._patch<T>(path, body, this._withClientId(options))
  }

  protected override _put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return super._put<T>(path, body, this._withClientId(options))
  }

  protected override _delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return super._delete<T>(path, this._withClientId(options))
  }
}
