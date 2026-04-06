import { BaseResource } from '../base.js'
import type { RequestOptions } from '../../types/common.js'
import { SimulatorNotAvailableError } from '../../error.js'
import type { SimulateDepositParams, SimulateDepositResponse } from './types.js'

export class SimulatorDepositsResource extends BaseResource {
  constructor(
    http: ConstructorParameters<typeof BaseResource>[0],
    private readonly isProduction: boolean
  ) {
    super(http)
  }

  private _assertSandbox(): void {
    if (this.isProduction) throw new SimulatorNotAvailableError()
  }

  /** Simulate a deposit into a banking account. POST /v1/simulation/deposit */
  simulate(params: SimulateDepositParams, options?: RequestOptions): Promise<SimulateDepositResponse> {
    this._assertSandbox()
    return this._post<SimulateDepositResponse>('/v1/simulation/deposit', params, options)
  }
}
