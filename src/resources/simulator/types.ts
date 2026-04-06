// ─── Issuing Simulator ────────────────────────────────────────────────────────

export interface SimulateAuthorizationParams {
  card_id: string
  transaction_amount: number
  transaction_currency: string
  merchant_name: string
  merchant_category_code: string
  transaction_status: string
}

export interface SimulateAuthorizationResponse {
  card_id: string
  card_number: string
  cardholder_id: string
  transaction_id: string
  transaction_type: string
  card_available_balance: string
  authorization_code?: string
  billing_amount: string
  billing_currency: string
  transaction_amount: string
  transaction_currency: string
  transaction_time: string
  posted_time?: string
  merchant_data?: Record<string, unknown>
  failure_reason?: string
  transaction_status: string
}

export interface SimulateReversalParams {
  transaction_id: string
}

// ─── Deposit Simulator ────────────────────────────────────────────────────────

export interface SimulateDepositParams {
  amount: number
  currency: string
  sender_swift_code: string
  receiver_account_number?: string
  sender_account_number?: string
  sender_country?: string
  sender_name?: string
}

export interface SimulateDepositResponse {
  deposit_id: string
  short_reference_id: string
  amount: string
  currency: string
  deposit_status: 'PENDING' | 'COMPLETED' | 'FAILED'
  create_time: string
  complete_time?: string
  receiver_account_number?: string
  sender?: {
    sender_name?: string
    sender_country?: string
    sender_account_number?: string
    sender_swift_code?: string
  }
}
