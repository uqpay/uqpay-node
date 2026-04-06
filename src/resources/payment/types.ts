// ─── Payment Intents ──────────────────────────────────────────────────────────

export type PaymentIntentStatus =
  | 'REQUIRES_PAYMENT_METHOD'
  | 'REQUIRES_CUSTOMER_ACTION'
  | 'REQUIRES_CAPTURE'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'CANCELLED'
  | 'FAILED'

export interface CreatePaymentIntentParams {
  amount: string
  currency: string
  merchant_order_id: string
  return_url: string
  description: string
  payment_method?: Record<string, unknown>
  ip_address?: string
  payment_orders?: Record<string, unknown>
  browser_info?: Record<string, unknown>
  metadata?: Record<string, string>
}

export interface UpdatePaymentIntentParams {
  amount?: string
  currency?: string
  customer?: Record<string, unknown>
  customer_id?: string
  payment_orders?: Record<string, unknown>
  merchant_order_id?: string
  description?: string
  metadata?: Record<string, string>
  return_url?: string
}

export interface ConfirmPaymentIntentParams {
  payment_method?: Record<string, unknown>
  ip_address?: string
  browser_info?: Record<string, unknown>
  return_url?: string
}

export interface CapturePaymentIntentParams {
  amount_to_capture?: string
}

export interface CancelPaymentIntentParams {
  cancellation_reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'abandoned'
}

export interface PaymentIntent {
  payment_intent_id: string
  amount: string
  currency: string
  intent_status: PaymentIntentStatus
  description?: string
  available_payment_method_types?: string[]
  captured_amount?: string
  cancel_time?: string
  cancellation_reason?: string
  client_secret?: string
  merchant_order_id?: string
  metadata?: Record<string, string>
  next_action?: Record<string, unknown>
  return_url?: string
  create_time?: string
  complete_time?: string
  update_time?: string
  latest_payment_attempt?: PaymentAttempt
}

export interface ListPaymentIntentsParams {
  page_size?: number
  page_number?: number
  intent_status?: PaymentIntentStatus
  create_start_time?: string
  create_end_time?: string
}

// ─── Refunds ──────────────────────────────────────────────────────────────────

export type RefundStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REVERSAL_INITIATED'
  | 'REVERSAL_PROCESSING'
  | 'REVERSAL_SUCCEEDED'

export interface CreateRefundParams {
  payment_intent_id: string
  amount: string
  reason: string
  payment_attempt_id?: string
  metadata?: Record<string, string>
}

export interface Refund {
  payment_refund_id: string
  payment_attempt_id: string
  amount: string
  currency: string
  refund_status: RefundStatus
}

export interface ListRefundsParams {
  page_size?: number
  page_number?: number
  start_time?: string
  end_time?: string
  payment_intent_id?: string
  merchant_order_id?: string
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export type PaymentPayoutStatus = 'INITIATED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'

export interface CreatePaymentPayoutParams {
  payout_currency: string
  payout_amount: string
  statement_descriptor: string
  internal_note?: string
}

export interface PaymentPayout {
  payout_id: string
  payout_currency: string
  payout_amount: string
  statement_descriptor: string
  payout_status: PaymentPayoutStatus
  create_time?: string
  completed_time?: string
  internal_note?: string
}

export interface ListPaymentPayoutsParams {
  page_size?: number
  page_number?: number
  start_time?: string
  end_time?: string
  payout_status?: PaymentPayoutStatus
}

// ─── Bank Accounts ────────────────────────────────────────────────────────────

export interface CreateBankAccountParams {
  currency: string
  account_number: string
  bank_name: string
  swift_code: string
  bank_country_code: string
  bank_address: string
  [key: string]: unknown
}

export interface UpdateBankAccountParams {
  account_number: string
  bank_name: string
  swift_code: string
  bank_country_code: string
  bank_address: string
  [key: string]: unknown
}

export interface BankAccount {
  id: string
  account_name?: string
  currency: string
  account_status?: string
  account_number: string
  bank_name: string
  swift_code: string
  bank_country_code: string
  bank_address?: string
  [key: string]: unknown
}

export interface ListBankAccountsParams {
  page_size?: number
  page_number?: number
}

// ─── Balances ─────────────────────────────────────────────────────────────────

export interface PaymentBalance {
  currency: string
  available_balance: string
  pending_balance: string
}

export interface ListPaymentBalancesParams {
  page_size?: number
  page_number?: number
}

// ─── Payment Attempts ─────────────────────────────────────────────────────────

export type PaymentAttemptStatus =
  | 'INITIATED'
  | 'AUTHENTICATION_REDIRECTED'
  | 'PENDING_AUTHORIZATION'
  | 'AUTHORIZED'
  | 'CAPTURE_REQUESTED'
  | 'SETTLED'
  | 'SUCCEEDED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED'

export interface PaymentAttempt {
  attempt_id: string
  amount: string
  currency: string
  captured_amount?: string
  refunded_amount?: string
  create_time?: string
  update_time?: string
  complete_time?: string
  cancellation_reason?: string
  auth_code?: string
  arn?: string
  rrn?: string
  advice_code?: '01' | '02' | '03' | '21' | '85'
  authentication_data?: {
    cvv_result?: 'M' | 'N' | 'P' | 'U'
    avs_result?: string
    three_ds?: Record<string, unknown>
  }
  payment_method?: Record<string, unknown>
  failure_code?: string
  attempt_status: PaymentAttemptStatus
}

export interface ListPaymentAttemptsParams {
  page_size?: number
  page_number?: number
  payment_intent_id?: string
  attempt_status?: PaymentAttemptStatus
}

// ─── Settlements ──────────────────────────────────────────────────────────────

export interface Settlement {
  [key: string]: unknown
}

export interface ListSettlementsParams {
  page_size?: number
  page_number?: number
  payment_intent_id?: string
  settlement_batch_id?: string
  settled_start_time?: string
  settled_end_time?: string
}
