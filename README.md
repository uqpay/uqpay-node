# UQPay Node.js SDK

Official Node.js SDK for the [UQPay API](https://docs.uqpay.com/).

## Requirements

- Node.js 20+
- A UQPay account with API credentials

## Installation

```bash
npm install @uqpay/sdk
```

## Quick Start

```ts
import { UQPayClient } from '@uqpay/sdk'

const client = new UQPayClient({
  clientId: 'your-client-id',
  apiKey: 'your-api-key',
  environment: 'sandbox', // or 'production'
})

// Retrieve an account
const account = await client.account.accounts.retrieve('acc-123')
console.log(account.status) // 'ACTIVE'
```

## Configuration

```ts
const client = new UQPayClient({
  clientId: 'your-client-id',   // required
  apiKey: 'your-api-key',        // required
  environment: 'sandbox',        // 'sandbox' | 'production' — default: 'sandbox'
  webhookSecret: 'whsec_...',    // required for webhook verification
  timeout: 30_000,               // request timeout in ms — default: 30000
  maxRetries: 2,                 // automatic retry count — default: 2
  logLevel: 'info',              // 'none' | 'info' | 'debug' — default: 'none'
})
```

## Authentication

The SDK handles authentication automatically. It exchanges your `clientId` and `apiKey` for a token, caches it, and refreshes it before expiry. You do not need to manage tokens manually.

## Resources

### Account

```ts
// Retrieve a single account
const account = await client.account.accounts.retrieve('acc-123')

// List accounts (paginated)
const page = await client.account.accounts.list({ page_number: 1, page_size: 20 })

// Create a sub-account
const subAccount = await client.account.subAccounts.create({
  business_type: 'BANKING',
  entity_type: 'COMPANY',
  nickname: 'My Sub-account',
  // ...
})

// Get required additional documents for a country
const docs = await client.account.additionalDocs.get({
  country: 'SG',
  business_code: 'BANKING',
})
```

### Banking

```ts
// Balances
const balances = await client.banking.balances.list({ page_number: 1, page_size: 20 })
const transactions = await client.banking.balances.listTransactions({ page_number: 1, page_size: 20 })

// Deposits
const deposits = await client.banking.deposits.list({ page_number: 1, page_size: 20 })

// Transfers
const transfer = await client.banking.transfers.create({
  source_account_id: 'acc-123',
  destination_account_id: 'acc-456',
  currency: 'SGD',
  amount: 100,
})
const transfers = await client.banking.transfers.list({ page_number: 1, page_size: 20 })

// Payouts
const payout = await client.banking.payouts.create({
  beneficiary_id: 'ben-123',
  currency: 'SGD',
  amount: 50,
  purpose_code: 'PERSONAL',
  // ...
})

// Beneficiaries
const beneficiary = await client.banking.beneficiaries.create({ /* ... */ })
const beneficiaries = await client.banking.beneficiaries.list({ page_number: 1, page_size: 20 })

// Conversions
const quote = await client.banking.conversions.createQuote({
  sell_currency: 'SGD',
  buy_currency: 'USD',
  amount: 100,
  fixed_side: 'SELL',
})
const conversion = await client.banking.conversions.create({
  quote_id: quote.quote_id,
})

// Virtual Accounts
const va = await client.banking.virtualAccounts.create({
  currency: 'SGD',
  // ...
})

// Exchange Rates
const rates = await client.banking.conversions.listCurrentRates({
  currency_pairs: ['SGD/USD', 'USD/SGD'],
})

// Payment Methods
const methods = await client.banking.paymentMethods.list({ page_number: 1, page_size: 20 })
```

### Issuing

```ts
// ── Cardholders ────────────────────────────────────────────────────────────────
const cardholder = await client.issuing.cardholders.create({
  email: 'user@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  country_code: 'SG',
  phone_number: '+6512345678',
})

// ── Cards ──────────────────────────────────────────────────────────────────────
const card = await client.issuing.cards.create({
  card_currency: 'SGD',
  cardholder_id: cardholder.cardholder_id,
  card_product_id: 'prod-123',
})

const cards = await client.issuing.cards.list({ page_number: 1, page_size: 20 })
const retrieved = await client.issuing.cards.retrieve(card.card_id)

// Freeze / unfreeze
await client.issuing.cards.updateStatus(card.card_id, { card_status: 'FROZEN' })
await client.issuing.cards.updateStatus(card.card_id, { card_status: 'ACTIVE' })

// Recharge and withdraw
await client.issuing.cards.recharge(card.card_id, { amount: 100 })
await client.issuing.cards.withdraw(card.card_id, { amount: 50 })

// ── Secure card display (iFrame) ───────────────────────────────────────────────
// Returns a short-lived URL (60s) that renders card number, CVV, and expiry in a
// PCI-compliant embedded iFrame hosted by UQPay. Open in a browser or embed in
// your frontend. MCP/CLI tools can surface the URL directly to the user.
const { iframeUrl, expires_at } = await client.issuing.cards.getSecureIframeUrl(card.card_id)
console.log(iframeUrl)   // https://embedded-sandbox.uqpaytech.com/iframe/card?token=...
console.log(expires_at)  // 2026-04-02T18:50:23+08:00

// Optional: set display language and custom styles
const { iframeUrl: styled } = await client.issuing.cards.getSecureIframeUrl(card.card_id, {
  lang: 'zh',
  styles: { '.card-number': { color: '#333', 'font-size': '18px' } },
})

// ── Balances ───────────────────────────────────────────────────────────────────
const balances = await client.issuing.balances.list({ page_number: 1, page_size: 20 })
const balance = await client.issuing.balances.retrieve('SGD')
const txns = await client.issuing.balances.listTransactions({ page_number: 1, page_size: 20 })

// ── Transactions ───────────────────────────────────────────────────────────────
const transactions = await client.issuing.transactions.list({ page_number: 1, page_size: 20 })

// ── Transfers ──────────────────────────────────────────────────────────────────
const transfer = await client.issuing.transfers.create({
  source_account_id: 'acc-123',
  destination_account_id: 'acc-456',
  currency: 'SGD',
  amount: 100,
})

// ── Products ───────────────────────────────────────────────────────────────────
const products = await client.issuing.products.list({ page_number: 1, page_size: 20 })

// ── Reports ────────────────────────────────────────────────────────────────────
const report = await client.issuing.reports.create({
  report_type: 'SETTLEMENT',
  start_time: '2026-01-01T00:00:00Z',
  end_time: '2026-01-31T23:59:59Z',
})
```

### Payment

```ts
// ── Payment Intents ────────────────────────────────────────────────────────────
const intent = await client.payment.paymentIntents.create({
  amount: '100.00',
  currency: 'SGD',
  // ...
})
await client.payment.paymentIntents.confirm(intent.payment_intent_id, { /* ... */ })
await client.payment.paymentIntents.capture(intent.payment_intent_id, { /* ... */ })
await client.payment.paymentIntents.cancel(intent.payment_intent_id)

const intents = await client.payment.paymentIntents.list({ page_number: 1, page_size: 20 })

// ── Refunds ────────────────────────────────────────────────────────────────────
const refund = await client.payment.refunds.create({
  payment_intent_id: intent.payment_intent_id,
  amount: '50.00',
})
const refunds = await client.payment.refunds.list({ page_number: 1, page_size: 20 })

// ── Bank Accounts ──────────────────────────────────────────────────────────────
const bankAccount = await client.payment.bankAccounts.create({
  currency: 'USD',
  bank_account_number: '1234567890',
  bank_routing_number: '021000021',
  bank_address: '12 Marina Blvd, Singapore',
  // ...
})

// ── Payouts ────────────────────────────────────────────────────────────────────
const payout = await client.payment.payouts.create({
  bank_account_id: bankAccount.bank_account_id,
  amount: '100.00',
  currency: 'USD',
})

// ── Balances ───────────────────────────────────────────────────────────────────
const balances = await client.payment.balances.list({ page_number: 1, page_size: 20 })

// ── Payment Attempts ───────────────────────────────────────────────────────────
const attempts = await client.payment.paymentAttempts.list({ page_number: 1, page_size: 20 })

// ── Settlements ────────────────────────────────────────────────────────────────
const settlements = await client.payment.settlements.list({ page_number: 1, page_size: 20 })
```

### Supporting (File Upload/Download)

```ts
import { readFileSync } from 'fs'

// Upload a file
const uploaded = await client.supporting.files.upload(
  readFileSync('./kyc-document.pdf'),
  { filename: 'kyc-document.pdf', mimeType: 'application/pdf' }
)
console.log(uploaded.file_id)

// Get download links
const links = await client.supporting.files.downloadLinks([uploaded.file_id])
console.log(links)
```

### Simulator (sandbox only)

The simulator is only available in the `sandbox` environment. Calling any simulator method in production throws a `SimulatorNotAvailableError`.

```ts
// Simulate a card authorization
const auth = await client.simulator.issuing.authorize({
  card_id: 'card-123',
  amount: 25,
  currency: 'SGD',
  merchant_name: 'Coffee Shop',
  // ...
})

// Simulate a reversal
await client.simulator.issuing.reverse({
  transaction_id: auth.transaction_id,
})

// Simulate a deposit
const deposit = await client.simulator.deposits.simulate({
  currency: 'SGD',
  amount: 500,
})
```

## Pagination

All list methods return a `PaginatedResponse<T>` with `data`, `total_pages`, and `total_items`.

```ts
const page = await client.issuing.cards.list({ page_number: 1, page_size: 50 })
console.log(page.data)        // Card[]
console.log(page.total_pages) // total number of pages
console.log(page.total_items) // total number of items
```

To paginate manually, increment `page_number` until `page_number >= total_pages`.

## Webhooks

Verify incoming webhook signatures from UQPay:

```ts
import express from 'express'

const app = express()

// IMPORTANT: Use raw body parser — do NOT use express.json() for webhook routes
app.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  let event

  try {
    event = client.webhooks.constructEvent(req.body, req.headers)
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  switch (event.event_name) {
    case 'card.create.succeeded':
      // handle event
      break
  }

  res.json({ received: true })
})
```

The `rawBody` passed to `constructEvent` must be the **original request body string or Buffer** — not a parsed JSON object.

## Authorization Decision (PGP)

Handle real-time card transaction authorization decisions. UQPAY sends PGP-encrypted transactions to your endpoint; you decrypt, decide, and return an encrypted response.

### Generate PGP Key Pair

```ts
import { generateAuthDecisionKeyPair } from '@uqpay/sdk'

const { publicKey, privateKey } = await generateAuthDecisionKeyPair({
  name: 'Acme Corp',
  email: 'issuing.tech@acme.com',
})
// Send publicKey to UQPAY, save privateKey securely
```

### Configure and Create Handler

```ts
// Configure PGP keys (once after client initialization)
// Accepts file paths (.asc/.pgp/.gpg) or armored key strings
await client.issuing.authDecision.configure({
  privateKey: './keys/my-private.asc',
  uqpayPublicKey: './keys/uqpay-public.asc',
  passphrase: process.env.PGP_PASSPHRASE, // optional
})

// Create handler — only write your business logic
const handler = client.issuing.authDecision.createHandler({
  decide: async (transaction) => {
    // transaction contains: billing_amount, merchant_name, card_id, etc.
    if (transaction.billing_amount > 10000) {
      return { response_code: '51' } // Insufficient Funds
    }
    return { response_code: '00', partner_reference_id: 'ref-001' }
  },
  onError: (err) => console.error('Auth decision error:', err),
})

// Mount to Express
app.post('/auth-decision', handler)
```

The SDK handles all PGP encryption/decryption and automatically injects `transaction_id` into the response.

## Error Handling

All API errors throw typed error classes:

```ts
import {
  UQPayClient,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  NetworkError,
  SimulatorNotAvailableError,
} from '@uqpay/sdk'

try {
  const account = await client.account.accounts.retrieve('acc-123')
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('Account not found')
  } else if (err instanceof ValidationError) {
    console.log('Bad request:', err.message)
  } else if (err instanceof RateLimitError) {
    console.log('Rate limited, will retry automatically')
  } else if (err instanceof NetworkError) {
    console.log('Network error:', err.message)
  } else if (err instanceof SimulatorNotAvailableError) {
    console.log('Simulator is only available in sandbox')
  }
}
```

All `UQPayError` subclasses expose:

| Field | Type | Description |
|-------|------|-------------|
| `message` | `string` | Human-readable error message |
| `httpStatus` | `number` | HTTP status code |
| `type` | `string` | API error type string |
| `code` | `string` | API error code |

## Idempotency

All requests automatically include a UUID idempotency key. To provide your own:

```ts
await client.account.subAccounts.create(params, {
  headers: { 'x-idempotency-key': 'your-uuid-v4' },
})
```

## Acting on Behalf of a Sub-account

```ts
await client.account.accounts.retrieve('acc-123', {
  headers: { 'x-on-behalf-of': 'sub-account-id' },
})
```

## Retries

The SDK automatically retries failed requests (server errors, rate limits, network errors) with exponential backoff. Configure globally or per-request:

```ts
// Global
const client = new UQPayClient({ ..., maxRetries: 3 })

// Per-request
await client.account.accounts.retrieve('acc-123', { maxRetries: 0 })
```

## Escape Hatch

For endpoints not yet covered by the SDK:

```ts
const result = await client.request('POST', '/v1/some/endpoint', {
  body: { key: 'value' },
})
```

## Partner / Platform Info

Append your platform info to the User-Agent header:

```ts
client.setAppInfo('MyPlatform', '2.0.0', 'https://myplatform.com')
// User-Agent: uqpay-node/0.1.0 node/20.0.0 MyPlatform/2.0.0 (https://myplatform.com)
```

## Logging

```ts
const client = new UQPayClient({
  ...,
  logLevel: 'debug', // logs all requests and responses
})
```

Sensitive fields (`apiKey`, `card_number`, `cvc`, `iban`, etc.) are automatically redacted from logs. Add custom fields:

```ts
const client = new UQPayClient({
  ...,
  logLevel: 'debug',
  redactFields: ['my_secret_field'],
})
```

## Documentation

Full API reference: [https://docs.uqpay.com/](https://docs.uqpay.com/)

## License

MIT
