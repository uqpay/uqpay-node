// ─── Main client ──────────────────────────────────────────────────────────────
export { UQPayClient } from './client.js'

// ─── Error classes ────────────────────────────────────────────────────────────
export {
  UQPayError,
  AuthenticationError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  ConflictError,
  IdempotencyError,
  ServerError,
  NetworkError,
  UQPayWebhookError,
  SimulatorNotAvailableError,
  InvalidIdempotencyKeyError,
} from './error.js'
export type { KycMissingField } from './error.js'

// ─── Webhook types ────────────────────────────────────────────────────────────
export type { UQPayWebhookEvent, WebhookOptions } from './webhooks.js'

// ─── Account resource types ───────────────────────────────────────────────────
export type {
  // Sub-types
  Address,
  Representative,
  TosAcceptance,
  CompanyInfo,
  IndividualInfo,
  IdentityVerification,
  BusinessDetails,
  // Params
  CreateSubAccountParams,
  ListAccountsParams,
  GetAdditionalDocsParams,
  // Sub-types
  ContactDetails,
  // Responses
  CreateSubAccountResponse,
  RetrieveAccountResponse,
  AdditionalDocument,
  CreateAccountResponse,
  // Create Account sub-types
  CreateAccountAddress,
  CreateAccountContactDetails,
  MonthlyEstimatedRevenue,
  AccountDocument,
  AccountDocumentWithType,
  AccountOtherDocumentation,
  CreateAccountIndividualIdentification,
  CreateIndividualAccountParams,
  RepresentativeRole,
  CreateAccountRepresentative,
  CreateAccountBusinessDetails,
  CreateCompanyAccountParams,
  CreateAccountParams,
  // Enums
  BusinessType,
  EntityType,
  AccountStatus,
  VerificationStatus,
} from './resources/account/types.js'

// ─── Supporting resource types ────────────────────────────────────────────────
export type {
  UploadFileResponse,
  UploadFileOptions,
  DownloadLinksResponse,
  DownloadFileInfo,
} from './resources/supporting/types.js'

// ─── Banking resource types ───────────────────────────────────────────────────
export type {
  // Balances
  Balance,
  ListBalancesParams,
  BalanceTransaction,
  ListBalanceTransactionsParams,
  // Deposits
  DepositStatus,
  Deposit,
  ListDepositsParams,
  // Transfers
  CreateTransferParams,
  CreateTransferResponse,
  Transfer,
  ListTransfersParams,
  // Payouts
  FeePaymentMethod,
  PayoutPurposeCode,
  CreatePayoutParams,
  CreatePayoutResponse,
  Payout,
  ListPayoutsParams,
  // Beneficiaries
  BeneficiaryEntityType,
  CreateBeneficiaryParams,
  CreateBeneficiaryResponse,
  Beneficiary,
  ListBeneficiariesParams,
  CheckBeneficiaryParams,
  // Conversions
  CreateQuoteParams,
  QuoteResponse,
  CreateConversionParams,
  Conversion,
  ListConversionsParams,
  ConversionDate,
  ListConversionDatesParams,
  // Virtual Accounts
  CreateVirtualAccountParams,
  CreateVirtualAccountResponse,
  VirtualAccount,
  ListVirtualAccountsParams,
  // Payment Methods
  ListPaymentMethodsParams,
  PaymentMethod,
  // Exchange Rates
  RateItem,
  ExchangeRatesData,
  ExchangeRatesResponse,
  ListCurrentRatesParams,
} from './resources/banking/types.js'

// ─── Issuing resource types ───────────────────────────────────────────────────
export type {
  // Cards
  CardStatus,
  OrderStatus,
  SpendingControl,
  RiskControls,
  CreateCardParams,
  CreateCardResponse,
  Card,
  SecureCardDetails,
  UpdateCardParams,
  UpdateCardStatusParams,
  UpdateCardStatusResponse,
  ActivateCardParams,
  ActivateCardResponse,
  AssignCardParams,
  PanTokenResponse,
  SecureIframeOptions,
  SecureIframeResult,
  CardRechargeWithdrawParams,
  CardRechargeWithdrawResponse,
  ListCardsParams,
  // Cards (new KYC)
  CardholderRequiredFields,
  // Cardholders
  CardholderStatus,
  KycLevel,
  Gender,
  IdvStatus,
  DeliveryAddress,
  ResidentialAddress,
  IdentityDocument,
  KycVerification,
  CreateCardholderParams,
  CreateCardholderResponse,
  Cardholder,
  UpdateCardholderParams,
  ListCardholdersParams,
  // Balances
  IssuingBalanceStatus,
  IssuingBalance,
  ListIssuingBalancesParams,
  IssuingBalanceTransaction,
  ListIssuingBalanceTransactionsParams,
  // Transactions
  MerchantData,
  CardTransaction,
  ListCardTransactionsParams,
  // Transfers
  CreateIssuingTransferParams,
  CreateIssuingTransferResponse,
  IssuingTransfer,
  // Products
  ProductStatus,
  ProductRequiredField,
  CardProduct,
  ListProductsParams,
  // Webhook payloads
  CardholderKycStatusChangedPayload,
  CardholderUpdatedPayload,
  // Reports
  CreateReportParams,
  CreateReportResponse,
  // Auth Decision
  AuthDecisionTransaction,
  AuthDecisionResult,
  AuthDecisionConfig,
  AuthDecisionHandlerOptions,
} from './resources/issuing/types.js'

// ─── Payment resource types ───────────────────────────────────────────────────
export type {
  // Payment Intents
  PaymentIntentStatus,
  CreatePaymentIntentParams,
  UpdatePaymentIntentParams,
  ConfirmPaymentIntentParams,
  CapturePaymentIntentParams,
  CancelPaymentIntentParams,
  PaymentIntent,
  ListPaymentIntentsParams,
  // Refunds
  RefundStatus,
  CreateRefundParams,
  Refund,
  ListRefundsParams,
  // Payouts
  PaymentPayoutStatus,
  CreatePaymentPayoutParams,
  PaymentPayout,
  ListPaymentPayoutsParams,
  // Bank Accounts
  CreateBankAccountParams,
  UpdateBankAccountParams,
  BankAccount,
  ListBankAccountsParams,
  // Balances
  PaymentBalance,
  ListPaymentBalancesParams,
  // Payment Attempts
  PaymentAttemptStatus,
  PaymentAttempt,
  ListPaymentAttemptsParams,
  // Settlements
  Settlement,
  ListSettlementsParams,
} from './resources/payment/types.js'

// ─── Simulator resource types ─────────────────────────────────────────────────
export type {
  SimulateAuthorizationParams,
  SimulateAuthorizationResponse,
  SimulateReversalParams,
  SimulateDepositParams,
  SimulateDepositResponse,
} from './resources/simulator/types.js'

// ─── Shared types ─────────────────────────────────────────────────────────────
export type {
  Environment,
  LogLevel,
  ErrorType,
  WebhookEventType,
  PaginatedResponse,
  PaginationParams,
  RequestOptions,
  UQPayClientConfig,
} from './types/common.js'

// ─── Auth Decision ───────────────────────────────────────────────────────────
export { generateAuthDecisionKeyPair } from './crypto/pgp.js'
export type { AuthDecisionKeyPairOptions, AuthDecisionKeyPair } from './crypto/pgp.js'

// ─── Utilities ────────────────────────────────────────────────────────────────
export { generateIdempotencyKey } from './idempotency.js'
export { SDK_VERSION } from './http.js'
