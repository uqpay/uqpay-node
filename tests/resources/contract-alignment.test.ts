import { expect, it } from 'vitest'
import type { ResetPinParams, ResetPinResponse, CardTransaction } from '../../src/resources/issuing/types.js'
import type { RfiAnswerItem, Rfi } from '../../src/resources/account/types.js'
import type { SimulateDepositParams } from '../../src/resources/simulator/types.js'
it('exposes the aligned request and response contract', () => {
 const pin: ResetPinParams = {card_id:'card-1',pin:'135790',type:'UPDATE',old_pin:'024680'}
 const answer: RfiAnswerItem = {key:'note',type:'TEXT',text:'source of funds'}
 const response: Rfi = {request:[{question:{key:'document',type:'ATTACHMENT'},answer:{type:'ATTACHMENT',attachments:[{file_name:'proof.pdf',size:42}]}}]}
 const deposit: SimulateDepositParams = {account_id:'account-1',amount:10,currency:'SGD',sender_swift_code:'WELGBE22'}
 const accepted: ResetPinResponse = {request_status:'SUCCESS',card_id:'card-1',card_order_id:'order-1',order_status:'PROCESSING',create_time:'2026-09-17T00:00:00Z'}
 const settlement: Pick<CardTransaction,'settlement_status'> = {settlement_status:'SETTLED'}
 expect([pin.old_pin,answer.text,response.request?.[0]?.answer?.attachments?.[0]?.file_name,deposit.account_id,accepted.card_order_id,settlement.settlement_status]).toEqual(['024680','source of funds','proof.pdf','account-1','order-1','SETTLED'])
})

import { vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { IssuingResource } from '../../src/resources/issuing/index.js'
import { AccountResource } from '../../src/resources/account/index.js'
import { SimulatorResource } from '../../src/resources/simulator/index.js'

it('sends PIN/RFI/deposit bodies and retains asynchronous and detail responses', async () => {
 const accepted = {request_status:'SUCCESS', card_id:'card-1',card_order_id:'order-1',order_status:'PROCESSING',create_time:'2026-09-17T00:00:00Z'}
 const rfi = {rfi_id:'ACTREQ-test',request:[{answer:{type:'ATTACHMENT',attachments:[{file_type:'pdf',file_name:'proof.pdf',size:42,url:'https://example.test/proof'}]}}]}
 const response = (body: unknown) => ({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>body,text:async()=>JSON.stringify(body)})
 const api = vi.fn().mockResolvedValue(response(accepted))
 const token = new TokenManager('client','key','https://api-sandbox.example.test',vi.fn().mockResolvedValue(response({auth_token:'header.'+Buffer.from(JSON.stringify({client_id:'client',entity_id:'account-1',short_entity_id:'A1',parent_entity_id:'0',api_version:'V1.0',bus_type:'BANKING',exp:4102444800})).toString('base64url')+'.signature',expired_at:4102444800})))
 const http = new HttpClient('https://api-sandbox.example.test',token,new Logger('none'),'client','3.0.0',30000,api)
 const issuing = new IssuingResource(http,'https://api-sandbox.example.test')
 const art = {card_art_id:'art-1',name_on_card:'Test'}
 expect((await issuing.cards.update('card-1',art)).order_status).toBe('PROCESSING')
 expect(JSON.parse(api.mock.lastCall?.[1].body)).toEqual(art)
 expect(api.mock.lastCall?.[0]).toContain('/v1/issuing/cards/card-1')
 const account = new AccountResource(http)
 const simulator = new SimulatorResource(http,'https://api-sandbox.example.test')
 for (const params of [
  {card_id:'card-1',pin:'135790'},
  {card_id:'card-1',pin:'135790',type:'RESET'},
  {card_id:'card-1',pin:'135790',type:'UPDATE',old_pin:'024680'},
 ] satisfies ResetPinParams[]) {
  expect(await issuing.cards.resetPin(params)).toEqual(accepted)
  expect(JSON.parse(api.mock.lastCall?.[1].body)).toEqual(params)
  expect(api.mock.lastCall?.[0]).toContain('/v1/issuing/cards/pin')
 }
 api.mockResolvedValue(response(rfi))
 const answer = {rfi_id:'ACTREQ-test',answer:[{key:'note',type:'TEXT',text:'source of funds'},{key:'document',type:'ATTACHMENT',attachments:['file-1']}]} satisfies import('../../src/resources/account/types.js').AnswerRfiParams
 expect(await account.rfis.answer(answer)).toEqual(rfi)
 expect(JSON.parse(api.mock.lastCall?.[1].body)).toEqual(answer)
 api.mockResolvedValue(response({settlement_status:'SETTLED',transaction_amount:'123456789.01'}))
 expect((await issuing.transactions.retrieve('tx-1')).settlement_status).toBe('SETTLED')
 const deposit = {account_id:'account-1',amount:10,currency:'SGD',sender_swift_code:'WELGBE22'}
 await simulator.deposits.simulate(deposit)
 expect(JSON.parse(api.mock.lastCall?.[1].body)).toEqual(deposit)
})

// Compile-time PIN branch constraints and the required recipient account.
// @ts-expect-error UPDATE requires old_pin
const missingOldPin: ResetPinParams = {card_id:'card-1',pin:'135790',type:'UPDATE'}
// @ts-expect-error RESET prohibits old_pin
const unexpectedOldPin: ResetPinParams = {card_id:'card-1',pin:'135790',type:'RESET',old_pin:'024680'}
// @ts-expect-error Simulated deposits require an explicit account
const missingAccount: SimulateDepositParams = {amount:10,currency:'SGD',sender_swift_code:'WELGBE22'}

import type { KycVerification } from '../../src/resources/issuing/types.js'
import type { CheckBeneficiaryParams, Deposit } from '../../src/resources/banking/types.js'
it('accepts third party proof, IBAN-only checks and deposit sender classifications', () => {
 const kyc: KycVerification = {method:'THIRD_PARTY',kyc_proof:{provider:'DIDIT',reference_id:'reference-123'}}
 const check: CheckBeneficiaryParams = {entity_type:'COMPANY',payment_method:'LOCAL',currency:'EUR',iban:'DE89370400440532013000'}
 const deposit: Deposit = {deposit_id:'dep-1',deposit_method:'UQPAY_TRANSFER',sender:{sender_type:'COMPANY',name_type:'NAMED'}}
 expect(kyc.kyc_proof?.provider).toBe('DIDIT')
 expect(check.iban).toBe('DE89370400440532013000')
 expect(deposit.sender?.name_type).toBe('NAMED')
})

import { createHmac } from 'node:crypto'
import { WebhookVerifier } from '../../src/webhooks.js'
import type { PaymentIntent, PaymentAttempt } from '../../src/resources/payment/types.js'
import type { Card, Cardholder, CardProduct, UpdateCardParams } from '../../src/resources/issuing/types.js'
it('accepts nullable and empty response fields without weakening request bodies', () => {
 const response: Pick<PaymentIntent,'metadata'|'next_action'|'latest_payment_attempt'> = {metadata:null,next_action:null,latest_payment_attempt:null}
 const attempt: Pick<PaymentAttempt,'advice_code'|'authentication_data'> = {advice_code:'',authentication_data:{cvv_result:''}}
 const card: Pick<Card,'risk_controls'> = {risk_controls:null}
 const holder: Pick<Cardholder,'gender'> = {gender:''}
 const product: Pick<CardProduct,'mode_type'> = {}
 const update: UpdateCardParams = {card_art_id:'art-1',name_on_card:'Test'}
 expect([response.metadata,attempt.advice_code,card.risk_controls,holder.gender,product.mode_type,update.card_art_id]).toEqual([null,'',null,'',undefined,'art-1'])
})
it.each(['card','card_present','wechatpay','alipay','alipaycn','alipayhk','paynow','grabpay','applepay','googlepay','unionpay','crypto','tng','truemoney','gcash','dana','kakaopay','tosspay','naverpay','mpay','kplus','boost','rabbitlinepay','kaspi','hipay','shopeepay'])('retains signed %s webhook data including nulls and decimal strings', method => {
 const event = {version:'V1.6.0',event_id:'evt-test',event_name:'ACQUIRING',event_type:'acquiring.payment_intent.succeeded',data:{amount:'12345678901234567890.12345678',complete_time:null,metadata:null,payment_method:{type:method,[method]:{flow:null,os_type:'',static_qrcode:'qr',network:'VISA',issuer_country_code:'SG'}},wallet_type:'FUTURE_WALLET'}}
 const raw = JSON.stringify(event), timestamp = String(Date.now())
 const signature = createHmac('sha512','offline-secret').update(raw+timestamp).digest('hex')
 expect(new WebhookVerifier('offline-secret').constructEvent(raw,{'x-wk-signature':signature,'x-wk-timestamp':timestamp})).toEqual(event)
})
// @ts-expect-error At least one account identifier must be present.
const missingBeneficiaryAccount: CheckBeneficiaryParams = {entity_type:'COMPANY',payment_method:'LOCAL',currency:'EUR'}

import type { CardholderRequiredFields } from '../../src/index.js'
import type { RetrieveAccountResponse } from '../../src/resources/account/types.js'
it('types inline cardholder identity and individual account responses', () => {
 const fields: CardholderRequiredFields = {email:'test@example.test',first_name:'Test',last_name:'User',country_code:'SG'}
 const account: RetrieveAccountResponse = {account_id:'individual-1',status:'ACTIVE',entity_type:'INDIVIDUAL',person_details:{first_name:'Test'},residential_address:{country:'SG'}}
 expect(fields.country_code).toBe('SG')
 expect(account.person_details?.first_name).toBe('Test')
})

import type { MerchantData, CardholderKycStatusChangedPayload } from '../../src/resources/issuing/types.js'
it('allows sparse merchant data and exposes the KYC reason', () => {
 const merchant: MerchantData = {}
 const event: Pick<CardholderKycStatusChangedPayload,'reason'> = {reason:'more evidence required'}
 expect(merchant).toEqual({});expect(event.reason).toBe('more evidence required')
})
