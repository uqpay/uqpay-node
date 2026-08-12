import type {
  CreateVirtualAccountParams,
  VirtualAccountApplication,
  VirtualAccountApplicationWebhookEvent,
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

declare const verifier: WebhookVerifier
const parsed = verifier.constructEvent<VirtualAccountApplicationWebhookEvent>('', {})
const parsedVersion: number = parsed.data.public_version

void [create, list, version, closeReason, eventVersion, applicationSource, webhookVersion, parsedVersion]
