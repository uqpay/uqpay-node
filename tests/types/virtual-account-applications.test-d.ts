import type {
  CreateVirtualAccountParams,
  VirtualAccountApplication,
  VirtualAccountApplicationWebhookData,
  VirtualAccountApplicationWebhookEvent,
  LegacyVirtualAccountApplicationWebhookEvent,
  ListVirtualAccountApplicationsParams,
} from '../../src/index.js'
import { WebhookVerifier } from '../../src/webhooks.js'

const create: CreateVirtualAccountParams = {
  country: 'SG',
  currency: 'USD',
  payment_method: null,
  nickname: '',
}

const list: ListVirtualAccountApplicationsParams = {
  page_number: 1,
  page_size: 50,
  status: 'PARTIALLY_COMPLETED',
  country: 'SG',
  currency: 'USD',
}

declare const application: VirtualAccountApplication
const version: number = application.public_version
const closeReason: string = application.results[0]!.virtual_accounts[0]!.close_reason

declare const event: VirtualAccountApplicationWebhookEvent
const eventVersion: number = event.data.public_version
const applicationSource: string = event.source_id
const webhookVersion: 'V1.5.1' | 'V1.5.2' | 'V1.6.0' = event.version
const accountId: string = event.data.account_id
const directId: string = event.data.direct_id

type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]
type HasRequiredWebhookRoutingFields =
  'account_id' | 'direct_id' extends RequiredKeys<VirtualAccountApplicationWebhookData> ? true : never
type GatewayRoutingFieldLeak = Extract<keyof VirtualAccountApplication, 'account_id' | 'direct_id'>
const requiredWebhookRoutingFields: HasRequiredWebhookRoutingFields = true
const noGatewayRoutingFieldLeak: GatewayRoutingFieldLeak extends never ? true : never = true

declare const verifier: WebhookVerifier
const parsed = verifier.constructEvent<VirtualAccountApplicationWebhookEvent>('', {})
const parsedVersion: number = parsed.data.public_version

declare const legacyEvent: LegacyVirtualAccountApplicationWebhookEvent
const legacyApplicationId: string = legacyEvent.data.application_id

void [
  create, list, version, closeReason, eventVersion, applicationSource, webhookVersion,
  accountId, directId, requiredWebhookRoutingFields, noGatewayRoutingFieldLeak,
  parsedVersion, legacyApplicationId,
]
