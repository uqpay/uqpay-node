import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { IssuingResource } from '../../src/resources/issuing/index.js'
import { AccountResource } from '../../src/resources/account/index.js'
import { BankingResource } from '../../src/resources/banking/index.js'
import { PaymentResource } from '../../src/resources/payment/index.js'

it('preserves KYC boundaries across all three entry points, paging and proxy headers', async () => {
 const response = (body: unknown) => ({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>body,text:async()=>JSON.stringify(body)})
 const api = vi.fn().mockResolvedValue(response({}))
 const jwt = 'header.'+Buffer.from(JSON.stringify({client_id:'client',entity_id:'account-1',short_entity_id:'A1',parent_entity_id:'0',api_version:'V1.0',bus_type:'BANKING',exp:4102444800})).toString('base64url')+'.signature'
 const token = new TokenManager('client','key','https://api-sandbox.example.test',vi.fn().mockResolvedValue(response({auth_token:jwt,expired_at:4102444800})))
 const http = new HttpClient('https://api-sandbox.example.test',token,new Logger('none'),'client','3.0.0',30000,api)
 const issuing = new IssuingResource(http,'https://api-sandbox.example.test')
 for (const provider of ['SUMSUB','MYINFO','JUMIO','DIDIT','SHUFTI','REGTANK'] as const) {
  for (const length of [9,10,64,65]) for (const dob of ['2009-09-17','2008-09-17','1947-09-17','1946-09-17']) {
   const fields={email:'test@example.test',first_name:'Test',last_name:'User',country_code:'SG',phone_number:'81234567',date_of_birth:dob,kyc_verification:{method:'THIRD_PARTY' as const,kyc_proof:{provider,reference_id:'r'.repeat(length)}}}
   await issuing.cardholders.create(fields)
   expect(JSON.parse(api.mock.lastCall?.[1].body)).toEqual(fields)
   const update={date_of_birth:dob,kyc_verification:fields.kyc_verification}
   await issuing.cardholders.update('holder-1',update)
   expect(JSON.parse(api.mock.lastCall?.[1].body)).toEqual(update)
   await issuing.cards.create({cardholder_id:'holder-1',card_currency:'SGD',card_product_id:'product-1',cardholder_required_fields:fields})
   expect(JSON.parse(api.mock.lastCall?.[1].body).cardholder_required_fields).toEqual(fields)
  }
 }
 for (const page_size of [1,10,100]) {
  await issuing.cards.list({page_size,page_number:1})
  expect(new URL(api.mock.lastCall?.[0]).searchParams.get('page_size')).toBe(String(page_size))
 }
 const account=new AccountResource(http), banking=new BankingResource(http)
 // RFI list/detail and PIN order responses through the real HTTP client.
 const fixtures=JSON.parse(readFileSync('tests/fixtures/rfi-orders.json','utf8'))
 for (const rfi of fixtures.rfis) {
  api.mockResolvedValue(response(rfi))
  expect(await account.rfis.retrieve(rfi.rfi_id)).toEqual(rfi)
  expect(new URL(api.mock.lastCall?.[0]).pathname).toBe(`/v1/rfis/${rfi.rfi_id}`)
  const list={data:[rfi],total_pages:3,total_items:21}
  api.mockResolvedValue(response(list))
  expect(await account.rfis.list({page_size:10,page_number:2,status:'ACTION_REQUIRED'})).toEqual(list)
  const url=new URL(api.mock.lastCall?.[0])
  expect(url.pathname).toBe('/v1/rfis')
  expect(Object.fromEntries(url.searchParams)).toEqual({page_size:'10',page_number:'2',status:'ACTION_REQUIRED'})
  expect(api.mock.lastCall?.[1].method).toBe('GET')
 }
 for (const order of fixtures.orders) {
  api.mockResolvedValue(response(order))
  expect(await issuing.cards.retrieveOrder(order.card_order_id)).toEqual(order)
  expect(new URL(api.mock.lastCall?.[0]).pathname).toBe(`/v1/issuing/cards/${order.card_order_id}/order`)
  expect(api.mock.lastCall?.[1].method).toBe('GET')
 }

 for (const data of [
  {entity_type:'COMPANY',business_details:{legal_entity_name:'Example'}},
  {entity_type:'INDIVIDUAL',person_details:{first_name:'Test'},residential_address:{country:'SG'}},
 ]) {api.mockResolvedValue(response(data));expect(await account.accounts.retrieve('account-1')).toEqual(data)}
 // D122-D129: rotate distinct values so swapped fields cannot pass.
 const fields=['available_balance','frozen_balance','margin_balance','prepaid_balance'] as const
 const amounts=['0.00','1.23','-0.01','12345678901234567890.12','-12345678901234567890.12','0.12345678901234567890']
 for (let i=0;i<amounts.length;i++) {
  const balance={currency:'USD',...Object.fromEntries(fields.map((field,j)=>[field,amounts[(i+j)%amounts.length]]))}
  api.mockResolvedValue(response(balance))
  expect(await banking.balances.retrieve('USD')).toEqual(balance)
  expect(new URL(api.mock.lastCall?.[0]).pathname).toBe('/v1/balances/USD')
  const list={data:[balance],total_pages:1,total_items:1}
  api.mockResolvedValue(response(list))
  expect(await banking.balances.list({page_size:10,page_number:1})).toEqual(list)
  expect(new URL(api.mock.lastCall?.[0]).pathname).toBe('/v1/balances')
 }
 const payout={payer:{payer_id:'0',identification_type:''},beneficiary:{address:{country:'SG',city:'',state:'',street_address:''}}}
 api.mockResolvedValue(response(payout));expect(await banking.payouts.retrieve('payout-1')).toEqual(payout)
 api.mockResolvedValue(response({}))
 const payment = new PaymentResource(http,'client')
 // AQ-RESPONSE: per-operation missing/empty/populated fixtures.
 const restCases = [
  [() => payment.paymentAttempts.retrieve('pa-1'), [{},{complete_time:'',advice_code:'',authentication_data:{cvv_result:''}},{complete_time:'2026-09-17T00:00:00Z',advice_code:'01',authentication_data:{cvv_result:'M'}}]],
  [() => payment.refunds.retrieve('re-1'), [{},{metadata:null},{metadata:{}},{metadata:{ref:'0001'}}]],
  [() => payment.payouts.retrieve('po-1'), [{},{completed_time:''},{completed_time:'2026-09-17T00:00:00Z'}]],
  [() => payment.paymentIntents.retrieve('pi-1'), [{},{metadata:null,next_action:null,latest_payment_attempt:null},{metadata:{ref:'0001'},next_action:{redirect_to_url:{return_url:''}},latest_payment_attempt:{advice_code:''}}]],
 ] as const
 for (const [call, fixtures] of restCases) for (const fixture of fixtures) {
  api.mockResolvedValue(response(fixture));expect(await call()).toEqual(fixture)
 }
 api.mockResolvedValue(response({}))
 // D189-D196: every changed GET route, without a caller-supplied idempotency key.
 const routes = [
  ['/v2/payment/balances', (o: import('../../src/types/common.js').RequestOptions) => payment.balances.list({},o)],
  ['/v2/payment/balances/USD', (o: import('../../src/types/common.js').RequestOptions) => payment.balances.retrieve('USD',o)],
  ['/v2/payment/bankaccount', (o: import('../../src/types/common.js').RequestOptions) => payment.bankAccounts.list({},o)],
  ['/v2/payment/bankaccount/ba-1', (o: import('../../src/types/common.js').RequestOptions) => payment.bankAccounts.retrieve('ba-1',o)],
  ['/v2/payment/payout', (o: import('../../src/types/common.js').RequestOptions) => payment.payouts.list({},o)],
  ['/v2/payment/payout/po-1', (o: import('../../src/types/common.js').RequestOptions) => payment.payouts.retrieve('po-1',o)],
  ['/v2/payment/settlements', (o: import('../../src/types/common.js').RequestOptions) => payment.settlements.list({},o)],
  ['/v2/payment_intents/pi-1', (o: import('../../src/types/common.js').RequestOptions) => payment.paymentIntents.retrieve('pi-1',o)],
 ] as const
 for (const [path, call] of routes) for (const account of ['sub-account','']) {
  await call(account ? {headers:{'x-on-behalf-of':account}} : {})
  expect(new URL(api.mock.lastCall?.[0]).pathname).toBe(path)
  expect(api.mock.lastCall?.[1].method).toBe('GET')
  expect(api.mock.lastCall?.[1].headers['x-client-id']).toBe('client')
  expect(api.mock.lastCall?.[1].headers['x-on-behalf-of'] || '').toBe(account)
 }
 await payment.paymentIntents.create({amount:'1.00',currency:'USD',merchant_order_id:'merchant-1',description:'Test',return_url:'https://example.test/return'},{headers:{'x-idempotency-key':'550e8400-e29b-41d4-a716-446655440000'}})
 expect(api.mock.lastCall?.[1].headers['x-idempotency-key']).toBe('550e8400-e29b-41d4-a716-446655440000')
})
