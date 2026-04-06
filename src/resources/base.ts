import type { HttpClient } from '../http.js'
import type { RequestOptions } from '../types/common.js'

export abstract class BaseResource {
  constructor(protected readonly http: HttpClient) {}

  // Prefixed with _ to avoid clashing with public resource method names (e.g. a resource
  // that has a public `get(id)` method would conflict with a protected `get(path)` method).
  protected _get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.http.request<T>({ method: 'GET', path }, options)
  }

  protected _post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.http.request<T>({ method: 'POST', path, body }, options)
  }

  protected _patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.http.request<T>({ method: 'PATCH', path, body }, options)
  }

  protected _put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.http.request<T>({ method: 'PUT', path, body }, options)
  }

  protected _delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.http.request<T>({ method: 'DELETE', path }, options)
  }

  /** Serialises a params object to a query string (with leading `?`), omitting undefined values. */
  protected _qs(params: object): string {
    const s = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
      )
    ).toString()
    return s ? `?${s}` : ''
  }

}
