// ─── Cards ────────────────────────────────────────────────────────────────────

export type CardStatus = 'PENDING' | 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'CANCELLED' | 'LOST' | 'STOLEN' | 'FAILED'
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

export interface SpendingControl {
  interval: string
  categories?: string[]
  amount?: number
}

export interface RiskControls {
  allow_contactless?: boolean
  allow_atm?: boolean
  allow_online?: boolean
  [key: string]: unknown
}

export interface CreateCardParams {
  card_currency: 'SGD' | 'USD'
  cardholder_id: string
  card_product_id: string
  card_limit?: number
  spending_controls?: SpendingControl[]
  risk_controls?: RiskControls
  metadata?: Record<string, unknown>
  usage_type?: 'NORMAL' | 'ONE_TIME'
  auto_cancel_trigger?: 'ON_AUTH' | 'ON_CAPTURE'
  expiry_at?: string
}

export interface CreateCardResponse {
  card_id: string
  card_order_id: string
  create_time: string
  card_status: CardStatus
  order_status: OrderStatus
}

export interface Card {
  card_id: string
  card_bin?: string
  card_scheme?: string
  card_number?: string
  card_name?: string
  card_currency?: string
  card_product_id?: string
  form_factor?: string
  mode_type?: string
  card_limit?: string | number
  available_balance?: string | number
  cardholder?: Record<string, unknown>
  spending_controls?: SpendingControl[]
  risk_controls?: RiskControls
  metadata?: Record<string, unknown> | string | null
  card_status: CardStatus
  consumed_amount?: string | number
  update_reason?: string
  create_time?: string
  [key: string]: unknown
}

export interface SecureCardDetails {
  cvv: string
  expire_date: string
  card_number: string
}

export interface UpdateCardParams {
  card_limit?: number
  no_pin_payment_amount?: number
  spending_controls?: SpendingControl[]
  risk_controls?: RiskControls
  metadata?: Record<string, unknown>
}

export interface UpdateCardStatusParams {
  card_status: 'ACTIVE' | 'FROZEN' | 'CANCELLED'
  update_reason?: string
}

export interface UpdateCardStatusResponse {
  card_id: string
  card_order_id: string
  order_status: OrderStatus
  update_reason?: string
}

export interface ActivateCardParams {
  card_id: string
  activation_code: string
  pin: string
  no_pin_payment_amount?: number
}

export interface ActivateCardResponse {
  request_status: string
}

export interface AssignCardParams {
  cardholder_id: string
  card_number: string
  card_currency: string
  card_mode: 'SINGLE' | 'SHARE'
}

export interface PanTokenResponse {
  token: string
  expires_in: number
  expires_at: string
}

export interface SecureIframeOptions {
  lang?: string
  styles?: Record<string, Record<string, string>>
}

export interface SecureIframeResult {
  iframeUrl: string
  token: string
  expires_at: string
  expires_in: number
}

export interface CardRechargeWithdrawParams {
  amount: number
}

export interface CardRechargeWithdrawResponse {
  card_id: string
  card_order_id: string
  order_type: string
  amount: number
  card_currency: string
  create_time: string
  update_time: string
  complete_time?: string
  order_status: OrderStatus
}

export interface ListCardsParams {
  page_size: number
  page_number: number
  card_number?: string
  card_status?: CardStatus
  cardholder_id?: string
}

// ─── Cardholders ──────────────────────────────────────────────────────────────

export type CardholderStatus = 'FAILED' | 'PENDING' | 'SUCCESS' | 'INCOMPLETE'

export interface DeliveryAddress {
  city: string
  country: string
  line1: string
  postal_code: string
  state?: string
  line2?: string
}

export interface CreateCardholderParams {
  email: string
  first_name: string
  last_name: string
  country_code: string
  phone_number: string
  date_of_birth?: string
  delivery_address?: DeliveryAddress
  document_type?: 'pdf' | 'png' | 'jpg' | 'jpeg'
  document?: string
}

export interface CreateCardholderResponse {
  cardholder_id: string
  cardholder_status: CardholderStatus
}

export interface Cardholder {
  cardholder_id: string
  email: string
  number_of_cards?: number
  first_name: string
  last_name: string
  create_time?: string
  cardholder_status: CardholderStatus
  date_of_birth?: string
  country_code: string
  phone_number: string
  delivery_address?: DeliveryAddress
  review_status?: string
}

export interface UpdateCardholderParams {
  country_code?: string
  email?: string
  phone_number?: string
  delivery_address?: DeliveryAddress
  document_type?: 'pdf' | 'png' | 'jpg' | 'jpeg'
  document?: string
  date_of_birth?: string
}

export interface ListCardholdersParams {
  page_size: number
  page_number: number
  cardholder_status?: CardholderStatus
}

// ─── Issuing Balances ─────────────────────────────────────────────────────────

export type IssuingBalanceStatus = 'ACTIVE' | 'PENDING' | 'PROCESSING' | 'CLOSED'

export interface IssuingBalance {
  balance_id: string
  currency: string
  available_balance: string
  margin_balance: string
  frozen_balance: string
  create_time: string
  last_trade_time: string
  balance_status: IssuingBalanceStatus
}

export interface ListIssuingBalancesParams {
  page_size: number
  page_number: number
}

export interface ListIssuingBalanceTransactionsParams {
  page_size: number
  page_number: number
  start_time?: string
  end_time?: string
  transaction_type?: string
  transaction_status?: string
  currency?: string
  transaction_id?: string
}

export interface IssuingBalanceTransaction {
  transaction_id: string
  short_transaction_id: string
  account_id: string
  balance_id: string
  transaction_type: string
  currency: string
  amount: number
  create_time: string
  complete_time?: string
  transaction_status: string
  ending_balance: number
  description?: string
}

// ─── Card Transactions ────────────────────────────────────────────────────────

export interface MerchantData {
  category_code: string
  city: string
  country: string
  name: string
}

export interface CardTransaction {
  card_id: string
  card_number: string
  cardholder_id: string
  transaction_id: string
  short_transaction_id: string
  original_transaction_id?: string
  transaction_type: string
  transaction_fee: string
  transaction_fee_currency: string
  fee_pass_through: 'Y' | 'N'
  card_available_balance: string
  authorization_code?: string
  billing_amount: string
  billing_currency: string
  transaction_amount: string
  transaction_currency: string
  transaction_time: string
  posted_time?: string
  merchant_data?: MerchantData
  description?: string
  transaction_status: 'APPROVED' | 'DECLINED' | 'PENDING'
  wallet_type?: string
}

export interface ListCardTransactionsParams {
  page_size: number
  page_number: number
  card_id?: string
  start_time?: string
  end_time?: string
}

// ─── Issuing Transfers ────────────────────────────────────────────────────────

export interface CreateIssuingTransferParams {
  source_account_id: string
  destination_account_id: string
  currency: string
  amount: number
  remark?: string
}

export interface CreateIssuingTransferResponse {
  transfer_id: string
  short_transaction_id?: string
}

export interface IssuingTransfer {
  transfer_id: string
  short_transaction_id?: string
  reference_id?: string
  source_account_id: string
  destination_account_id: string
  amount: string
  fee_amount?: string
  currency: string
  transfer_status: 'PENDING' | 'FAILED' | 'COMPLETED'
  create_time: string
  complete_time?: string
  creator_id?: string
  remark?: string
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'ENABLED' | 'DISABLED'

export interface CardProduct {
  product_id: string
  mode_type: 'SHARE' | 'SINGLE'
  card_bin: string
  card_form: Array<'VIR' | 'PHY'>
  max_card_quota?: number
  card_scheme?: string
  no_pin_payment_amount?: Array<{ amount: number; currency: string }>
  card_currency?: string[]
  create_time?: string
  update_time?: string
  product_status: ProductStatus
}

export interface ListProductsParams {
  page_size: number
  page_number: number
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface CreateReportParams {
  report_type: string
  start_time: string
  end_time: string
}

export interface CreateReportResponse {
  report_id: string
}
