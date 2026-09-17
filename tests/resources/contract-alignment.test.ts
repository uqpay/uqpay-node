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
