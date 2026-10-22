import type { AssignCardParams } from '../../src/index.js'

const withSku: AssignCardParams = { cardholder_id: 'holder-1', card_number: 'synthetic', card_currency: 'USD', card_mode: 'SINGLE', metadata: { card_sku_code: 'SKU123456789' } }
const legacy: AssignCardParams = { card_number: 'synthetic', card_currency: 'USD', card_mode: 'SINGLE' }
// @ts-expect-error Metadata requires its Personal Visa SKU field when supplied.
const missingSku: AssignCardParams = { card_number: 'synthetic', card_currency: 'USD', card_mode: 'SINGLE', metadata: {} }
void [withSku, legacy, missingSku]
