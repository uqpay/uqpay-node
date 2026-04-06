// ─── Balances ─────────────────────────────────────────────────────────────────

export interface Balance {
  balance_id?: string
  currency: string
  available_balance?: string
  prepaid_balance?: string
  margin_balance?: string
  frozen_balance?: string
  create_time?: string
  last_trade_time?: string
  balance_status?: string
}

export interface ListBalancesParams {
  page_size: number
  page_number: number
}

export interface ListBalanceTransactionsParams {
  page_size: number
  page_number: number
  start_time?: string
  end_time?: string
  currency?: string
  transaction_type?: string
  transaction_status?: string
}

export interface BalanceTransaction {
  transaction_id: string
  account_id: string
  balance_id: string
  transaction_type: string
  currency: string
  amount: number
  credit_debit_type: string
  create_time: string
  complete_time: string
  reference_id: string
  transaction_status: string
  transaction_way: string
}

// ─── Deposits ─────────────────────────────────────────────────────────────────

export type DepositStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

export interface Deposit {
  deposit_id: string
  short_reference_id?: string
  currency?: string
  amount?: string
  deposit_fee?: string
  deposit_status?: DepositStatus
  deposit_reference?: string
  create_time?: string
  complete_time?: string
  receiver_account_number?: string
  sender?: {
    sender_name?: string
    sender_country?: string
    sender_account_number?: string
    sender_swift_code?: string
    sender_address?: string
  }
}

export interface ListDepositsParams {
  page_size: number
  page_number: number
  start_time?: string
  end_time?: string
  status?: DepositStatus
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export interface CreateTransferParams {
  source_account_id: string
  target_account_id: string
  currency: string
  amount: string
  reason: string
}

export interface CreateTransferResponse {
  transfer_id: string
  short_reference_id: string
}

export interface Transfer {
  transfer_id: string
  reference_id?: string
  short_reference_id?: string
  source_account_name?: string
  destination_account_name?: string
  transfer_currency?: string
  transfer_amount?: string
  transfer_reason?: string
  transfer_status?: string
  create_time?: string
  complete_time?: string
  created_by?: string
}

export interface ListTransfersParams {
  page_size: number
  page_number: number
  start_time?: string
  end_time?: string
  /** Banking API uses lowercase status values for filtering */
  transfer_status?: 'completed' | 'failed'
  currency?: string
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export type FeePaymentMethod = 'OURS' | 'SHARED'

export type PayoutPurposeCode =
  | 'AUDIO_VISUAL_SERVICES'
  | 'BILL_PAYMENT'
  | 'BUSINESS_EXPENSES'
  | 'CONSTRUCTION'
  | 'DONATION_CHARITABLE_CONTRIBUTION'
  | 'EDUCATION_TRAINING'
  | 'FAMILY_SUPPORT'
  | 'FREIGHT'
  | 'GOODS_PURCHASED'
  | 'INVESTMENT_CAPITAL'
  | 'INVESTMENT_PROCEEDS'
  | 'LIVING_EXPENSES'
  | 'LOAN_CREDIT_REPAYMENT'
  | 'MEDICAL_SERVICES'
  | 'PENSION'
  | 'PERSONAL_REMITTANCE'
  | 'PROFESSIONAL_BUSINESS_SERVICES'
  | 'REAL_ESTATE'
  | 'TAXES'
  | 'TECHNICAL_SERVICES'
  | 'TRANSFER_TO_OWN_ACCOUNT'
  | 'TRAVEL'
  | 'WAGES_SALARY'

export interface CreatePayoutParams {
  beneficiary_id?: string
  source_currency: string
  amount: string
  currency: string
  purpose_code: PayoutPurposeCode
  fee_paid_by: FeePaymentMethod
  payout_reason?: string
  reference?: string
  [key: string]: unknown
}

export interface CreatePayoutResponse {
  payout_id: string
  short_reference_id: string
  payout_status?: string
}

export interface Payout {
  payout_id: string
  short_reference_id: string
  payout_amount?: string
  payout_currency?: string
  source_currency?: string
  source_amount?: string
  amount_payer_pays?: string
  amount_beneficiary_receives?: string
  fee_amount?: string
  fee_currency?: string
  fee_paid_by?: FeePaymentMethod
  payout_status: string
  payout_date?: string
  payout_method?: string
  payout_reason?: string
  payout_reference?: string
  purpose_code?: PayoutPurposeCode
  create_time: string
  update_time?: string
  complete_time?: string | null
  beneficiary_id?: string
  failure_reason?: string
  failure_returned_amount?: string
  quote_id?: string
  [key: string]: unknown
}

export interface ListPayoutsParams {
  page_size: number
  page_number: number
  payout_status?: string
  start_time?: string
  end_time?: string
}

// ─── Beneficiaries ────────────────────────────────────────────────────────────

export type BeneficiaryEntityType = 'INDIVIDUAL' | 'COMPANY'

export interface BeneficiaryBankDetails {
  bank_name: string
  bank_address: string
  bank_country_code: string
  account_holder: string
  account_currency_code: string
  account_number?: string
  iban?: string
  swift_code?: string
  clearing_system?: string
  routing_code_type1?: string
  routing_code_value1?: string
  routing_code_type2?: string
  routing_code_value2?: string
}

export interface BeneficiaryAddress {
  country: string
  city: string
  street_address: string
  postal_code: string
  state: string
  nationality?: string
}

export interface CreateBeneficiaryParams {
  entity_type: BeneficiaryEntityType
  payment_method: 'LOCAL' | 'SWIFT'
  bank_details: BeneficiaryBankDetails
  address: BeneficiaryAddress
  email?: string
  nickname?: string
  /** Required for INDIVIDUAL */
  first_name?: string
  last_name?: string
  id_number?: string
  /** Required for COMPANY */
  company_name?: string
  additional_info?: {
    organization_code?: string
    proxy_id?: string
    id_type?: string
    id_number?: string
    tax_id?: string
    msisdn?: string
  }
}

export interface CreateBeneficiaryResponse {
  beneficiary_id: string
  short_reference_id: string
}

export interface Beneficiary {
  beneficiary_id: string
  short_reference_id?: string
  entity_type: BeneficiaryEntityType
  payment_method?: string
  email?: string
  nickname?: string
  beneficiary_status?: string
  /** @deprecated use beneficiary_status */
  status?: string
  first_name?: string
  last_name?: string
  company_name?: string
  id_number?: string
  summary?: string
  bank_details?: BeneficiaryBankDetails
  address?: BeneficiaryAddress
  create_time?: string
  [key: string]: unknown
}

export interface ListBeneficiariesParams {
  page_size: number
  page_number: number
  entity_type?: BeneficiaryEntityType
  nickname?: string
  currency?: string
  company_name?: string
}

export interface CheckBeneficiaryParams {
  entity_type: BeneficiaryEntityType
  account_number: string
  payment_method: 'LOCAL' | 'SWIFT'
  currency: string
  bank_country_code: string
  first_name?: string
  last_name?: string
  company_name?: string
  clearing_system?: string
  iban?: string
  additional_info?: Record<string, unknown>
}

// ─── Conversions ──────────────────────────────────────────────────────────────

export interface CreateQuoteParams {
  sell_currency: string
  buy_currency: string
  conversion_date: string
  sell_amount?: string
  buy_amount?: string
  transaction_type?: string
}

export interface QuoteResponse {
  quote_id: string
  sell_currency: string
  sell_amount: number
  buy_currency: string
  buy_amount: number
  quote_price: number
  currency_pair: string
  direct_rate: number
  inverse_rate: number
  validity: string
}

export interface CreateConversionParams {
  quote_id: string
  buy_currency: string
  sell_currency: string
  conversion_date: string
  buy_amount?: number
  sell_amount?: number
}

export interface Conversion {
  conversion_id: string
  short_reference_id: string
  buy_amount: number
  buy_currency: string
  sell_amount: number
  sell_currency: string
  created_date: string
  currency_pair: string
  reference: string
  status: string
}

export interface ListConversionsParams {
  page_size: number
  page_number: number
}

export interface ConversionDate {
  date: string
  [key: string]: unknown
}

export interface ListConversionDatesParams {
  currency_from: string
  currency_to: string
}

// ─── Virtual Accounts ─────────────────────────────────────────────────────────

export interface CreateVirtualAccountParams {
  currency: string
  payment_method?: 'LOCAL' | 'SWIFT'
}

export interface CreateVirtualAccountResponse {
  message: string
}

export interface VirtualAccount {
  currency?: string
  payment_method?: string
  account_number?: string
  account_holder?: string
  account_bank_id?: string
  bank_name?: string
  bank_address?: string
  bank_code?: string
  swift_code?: string
  country_code?: string
  capability?: { payment_method?: string }
  clearing_system?: { type?: string; value?: string }
  status?: string
  close_reason?: string
  [key: string]: unknown
}

export interface ListVirtualAccountsParams {
  page_size: number
  page_number: number
  currency?: string
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

export interface ListPaymentMethodsParams {
  currency: string
  country: string
}

export interface PaymentMethod {
  payment_method: string
  name?: string
  description?: string
  [key: string]: unknown
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

export interface RateItem {
  currency_pair: string
  buy_price: string
  sell_price: string
}

export interface ExchangeRatesData {
  rates?: RateItem[]
  unavailable_currency_pairs?: string[]
  last_updated?: string
}

export interface ExchangeRatesResponse {
  data?: ExchangeRatesData
}

export interface ListCurrentRatesParams {
  currency_pairs?: string[]
}
