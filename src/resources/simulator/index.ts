import type { HttpClient } from '../../http.js'
import { SimulatorIssuingResource } from './issuing.js'
import { SimulatorDepositsResource } from './deposits.js'

export class SimulatorResource {
  readonly issuing: SimulatorIssuingResource
  readonly deposits: SimulatorDepositsResource

  constructor(http: HttpClient, baseUrl: string) {
    const isProduction = !baseUrl.includes('sandbox')
    this.issuing = new SimulatorIssuingResource(http, isProduction)
    this.deposits = new SimulatorDepositsResource(http, isProduction)
  }
}

export * from './types.js'
