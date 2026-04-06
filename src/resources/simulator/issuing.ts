import { BaseResource } from '../base.js'
import type { RequestOptions } from '../../types/common.js'
import { SimulatorNotAvailableError } from '../../error.js'
import type { SimulateAuthorizationParams, SimulateAuthorizationResponse, SimulateReversalParams } from './types.js'

export class SimulatorIssuingResource extends BaseResource {
  constructor(
    http: ConstructorParameters<typeof BaseResource>[0],
    private readonly isProduction: boolean
  ) {
    super(http)
  }

  private _assertSandbox(): void {
    if (this.isProduction) throw new SimulatorNotAvailableError()
  }

  /** Simulate an issuing card authorization. POST /v1/simulation/issuing/authorization */
  authorize(params: SimulateAuthorizationParams, options?: RequestOptions): Promise<SimulateAuthorizationResponse> {
    this._assertSandbox()
    return this._post<SimulateAuthorizationResponse>('/v1/simulation/issuing/authorization', params, options)
  }

  /** Simulate a reversal on a previously authorized transaction. POST /v1/simulation/issuing/reversal */
  reverse(params: SimulateReversalParams, options?: RequestOptions): Promise<SimulateAuthorizationResponse> {
    this._assertSandbox()
    return this._post<SimulateAuthorizationResponse>('/v1/simulation/issuing/reversal', params, options)
  }
}
