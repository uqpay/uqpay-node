// ─── Common sub-types ─────────────────────────────────────────────────────────

export interface Address {
  street_address: string
  apartment_suite_or_floor?: string
  city: string
  state?: string
  postal_code: string
  country?: string
}

export interface Representative {
  legal_first_name_english: string
  legal_last_name_english: string
  name_in_other_language?: string
  email_address: string
  is_applicant: '0' | '1'
  job_title: string
  ownership_percentage?: number
  nationality: string
  tax_number?: string
  phone_number: string
  date_of_birth: string
  country_or_territory: string
  street_address: string
  city: string
  state?: string
  apartment_suite_or_floor?: string
  postal_code: string
  identification_type: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVING_LICENSE'
  identification_value: string
  identity_docs: string[]
  other_documents?: Array<{ type: string; doc_str: string }>
}

export interface TosAcceptance {
  ip: string
  date: string
  user_agent: string
}

// ─── Create Sub-Account ───────────────────────────────────────────────────────

export type BusinessType = 'BANKING' | 'ACQUIRING' | 'ISSUING'
export type EntityType = 'COMPANY' | 'INDIVIDUAL'

export interface CompanyInfo {
  legal_business_name: string
  legal_business_name_english: string
  country_of_incorporation: string
  company_type: 'SOLE_PROPRIETOR' | 'LIMITED_COMPANY' | 'PARTNERSHIP'
  phone_number: string
  email_address: string
  company_registration_number: string
  tax_type?: string
  tax_number?: string
  incorparate_date: string
  certification_of_incorporation: string[]
}

export interface IndividualInfo {
  first_name_english: string
  last_name_english: string
  name_in_other_language?: string
  nationality: string
  tax_number?: string
  phone_number: string
  email_address: string
  date_of_birth: string
  country_or_territory: string
  street_address: string
  city: string
  state?: string
  postal_code: string
}

export interface IdentityVerification {
  identification_type: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVING_LICENSE'
  identification_value: string
  identity_docs: string[]
}

export interface BusinessDetails {
  country_or_territory: string
  street_address: string
  city: string
  state?: string
  postal_code: string
  industry: string
  turnover_monthly?: string
  number_of_employee?: string
  website_url?: string
  company_description?: string
  account_purpose?: string[]
  banking_currencies?: string[]
  banking_countries?: string[]
}

export interface CreateSubAccountParams {
  business_type: BusinessType
  entity_type: EntityType
  nickname?: string
  /** 1 = inherit from master account, -1 = do not inherit. Required for COMPANY entity_type. */
  inherit?: 1 | -1
  company_info?: CompanyInfo
  company_address?: Address
  individual_info?: IndividualInfo
  identity_verification?: IdentityVerification
  ownership_details?: {
    representatives?: Representative[]
    shareholder_docs?: string[]
  }
  business_details?: BusinessDetails
  expected_activity?: {
    account_purpose?: string[]
    banking_countries?: string[]
    banking_currencies?: string[]
  }
  additional_documents?: {
    required_docs?: Array<{ profile_key: string; doc_str: string }>
    option_docs?: Array<{ profile_key: string; doc_str: string }>
  }
  tos_acceptance?: TosAcceptance
}

// ─── Create Sub-Account Response ─────────────────────────────────────────────

export type AccountStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CLOSED'
  | 'REVIEW'
  | 'PROCESSING'

export interface CreateSubAccountResponse {
  account_id: string
  short_reference_id: string
  status: AccountStatus
  business_type: BusinessType
  entity_type: EntityType
  nickname?: string
}

// ─── Retrieve Account ─────────────────────────────────────────────────────────

export type VerificationStatus = 'APPROVED' | 'PENDING' | 'REJECT' | 'EXPIRED' | 'RETURN'

export interface ContactDetails {
  email?: string
  phone?: string
}

export interface RetrieveAccountResponse {
  account_id: string
  short_reference_id?: string
  business_code?: BusinessType[]
  email?: string
  account_name?: string
  nick_name?: string
  country?: string
  status: AccountStatus
  verification_status?: VerificationStatus
  entity_type?: EntityType
  review_reason?: string
  contact_details?: ContactDetails
  business_details?: Record<string, unknown>
  registration_address?: Address
  business_address?: Record<string, unknown>[]
  representatives?: Record<string, unknown>[]
  documents?: Record<string, unknown>[]
  tos_acceptance?: Record<string, unknown>
}

// ─── List Accounts ────────────────────────────────────────────────────────────

export interface ListAccountsParams {
  page_number: number
  page_size: number
}

// ─── Create Account (POST /v1/accounts) ──────────────────────────────────────
// Legacy endpoint for Banking accounts. Uses a different field naming convention
// from CreateSubAccountParams (line1/line2 vs street_address).

export interface CreateAccountAddress {
  line1: string
  line2?: string
  city: string
  /** Two-letter ISO 3166-2 state/province code */
  state?: string
  postal_code: string
  /** Two-letter ISO 3166-1 alpha-2 country code */
  country?: string
}

export interface CreateAccountContactDetails {
  email: string
  phone: string
}

export interface MonthlyEstimatedRevenue {
  /** TM001–TM005 range codes */
  amount: 'TM001' | 'TM002' | 'TM003' | 'TM004' | 'TM005'
  /** ISO 4217 currency code, e.g. "SGD" */
  currency: string
}

export interface AccountDocument {
  front?: string
  front_file_id?: string
  back?: string
  back_file_id?: string
}

export interface AccountDocumentWithType extends AccountDocument {
  type: string
}

export interface AccountOtherDocumentation {
  type: 'PROOF_OF_ADDRESS' | 'OTHERS'
  documents?: Array<{ file?: string; file_id?: string }>
}

export interface CreateAccountIndividualIdentification {
  type: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE'
  id_number: string
  remark?: string
  citizenship_status?: 'non_resident' | 'singapore_citizen' | 'permanent_resident'
  documents: AccountDocument
}

export interface CreateIndividualAccountParams {
  entity_type: 'INDIVIDUAL'
  name: string
  contact_details: CreateAccountContactDetails
  person_details: {
    first_name_english: string
    last_name_english: string
    first_name?: string
    last_name?: string
    local_name?: string
    nationality: string
    date_of_birth: string
    tax_number?: string
    /** 0 = No, 1 = Yes */
    internationally: 0 | 1
    banking_currencies: string[]
    banking_countries: string[]
    monthly_estimated_revenue: MonthlyEstimatedRevenue
    account_purpose: Array<
      | 'PURCHASE'
      | 'BILL_PAYMENT'
      | 'EDUCATIONAL_EXPENSES'
      | 'PERSONAL_REMITTANCE'
      | 'LOAN_REPAYMENT'
      | 'INVESTMENT'
      | 'CHARITABLE_DONATION'
      | 'OTHERS'
    >
    other_purpose?: string
    identification: CreateAccountIndividualIdentification
  }
  residential_address: CreateAccountAddress
  documents: AccountDocumentWithType[]
  tos_acceptance: TosAcceptance
}

export type RepresentativeRole =
  | 'DIRECTOR'
  | 'BENEFICIAL_OWNER'
  | 'DIRECTOR_BENEFICIAL_OWNER'
  | 'AUTHORISED_PERSON'

export interface CreateAccountRepresentative {
  roles: RepresentativeRole
  first_name: string
  last_name: string
  nationality: string
  date_of_birth: string
  share_percentage?: string
  identification: {
    type: 'PASSPORT' | 'NATIONAL_ID' | 'DRIVERS_LICENSE'
    id_number: string
    documents: AccountDocument
  }
  residential_address: CreateAccountAddress
  as_applicant: boolean
  other_documentation?: AccountOtherDocumentation[]
}

export interface CreateAccountBusinessDetails {
  legal_entity_name?: string
  legal_entity_name_english: string
  incorporation_date: string
  registration_number: string
  business_structure:
    | 'SOLE_PROPRIETOR'
    | 'LIMITED_COMPANY'
    | 'PARTNERSHIP'
    | 'LISTED'
    | 'OTHERS'
  product_description: string
  merchant_category_code: string
  estimated_worker_count: 'BS001' | 'BS002' | 'BS003' | 'BS004' | 'BS005'
  monthly_estimated_revenue: MonthlyEstimatedRevenue
  account_purpose: Array<
    'COLLECTION' | 'PAYOUT' | 'CONVERT_FUNDS' | 'CARD_ISSUING' | 'PAYMENT' | 'USE_API'
  >
  website_url?: string
}

export interface CreateCompanyAccountParams {
  entity_type: 'COMPANY'
  name: string
  /** Two-letter ISO 3166-1 alpha-2 country code of incorporation */
  country: string
  contact_details: CreateAccountContactDetails
  business_details: CreateAccountBusinessDetails
  registration_address: Omit<CreateAccountAddress, 'country'>
  business_address: CreateAccountAddress[]
  representatives: CreateAccountRepresentative[]
  documents: AccountDocumentWithType[]
  tos_acceptance: TosAcceptance
}

export type CreateAccountParams = CreateIndividualAccountParams | CreateCompanyAccountParams

export interface CreateAccountResponse {
  account_id: string
  short_reference_id: string
  status: AccountStatus
  verification_status: VerificationStatus
}

// ─── Get Additional Documents ─────────────────────────────────────────────────

export interface GetAdditionalDocsParams {
  country: string
  business_code: string
}

export interface AdditionalDocument {
  profile_key: string
  profile_name: string
  /** 1 = required, 0 = optional */
  profile_option: 0 | 1
}
