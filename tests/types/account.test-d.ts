// Type-level regression test, checked by `npm run test:types` (tsc --noEmit).
//
// IndividualInfo must mirror the required fields of ACCOUNTCENTER_IndividualInfo
// in account-center/v1.6/connect.yaml. Two breaking changes added required
// fields the SDK never picked up:
//   - 2026-03-19: employment_status, industry, job_title, company_name
//   - 2026-07-02: gender, annual_income
// Missing any of these makes Create SubAccount reject INDIVIDUAL requests.
import type {
  BusinessDetails,
  CompanyAccountPurpose,
  IndividualInfo,
  Representative,
  CreateSubAccountParams,
} from '../../src/resources/account/types.js'

// Keys of T that are present AND non-optional.
type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

// `true` only if K is a required key of IndividualInfo; otherwise `never`,
// which makes the `const ... : Assert<...> = true` line a compile error.
type IsRequired<K extends string> = K extends RequiredKeys<IndividualInfo> ? true : never
type IsRequiredIn<T, K extends keyof T> = K extends RequiredKeys<T> ? true : never

const _firstNameEnglish: IsRequired<'first_name_english'> = true
const _dateOfBirth: IsRequired<'date_of_birth'> = true
const _state: IsRequired<'state'> = true // spec lists state under required
const _employmentStatus: IsRequired<'employment_status'> = true
const _industry: IsRequired<'industry'> = true
const _jobTitle: IsRequired<'job_title'> = true
const _companyName: IsRequired<'company_name'> = true
const _gender: IsRequired<'gender'> = true
const _annualIncome: IsRequired<'annual_income'> = true

// gender is constrained to the spec enum.
const _genderMale: IndividualInfo['gender'] = 'MALE'
const _genderFemale: IndividualInfo['gender'] = 'FEMALE'

// A fully-populated individual_info type-checks with no excess-property errors.
const complete: IndividualInfo = {
  first_name_english: 'John',
  last_name_english: 'Doe',
  nationality: 'SG',
  phone_number: '+6591234567',
  email_address: 'john.doe@example.com',
  date_of_birth: '1990-01-15',
  country_or_territory: 'SG',
  street_address: '1 Raffles Place',
  city: 'Singapore',
  state: 'Singapore',
  postal_code: '048616',
  employment_status: 'Employed',
  industry: 'Information Technology/IT',
  job_title: 'Business and administration professionals',
  company_name: 'Acme Corp.',
  gender: 'MALE',
  annual_income: '85000',
}

void [
  _firstNameEnglish, _dateOfBirth, _state, _employmentStatus, _industry, _jobTitle,
  _companyName, _gender, _annualIncome, _genderMale, _genderFemale, complete,
]

// A TS customer must be able to express a COMPLETE individual Create SubAccount
// payload through the public types — including identity_verification.face_docs,
// the full expected_activity (internationally / turnover_monthly /
// turnover_monthly_currency), and proof_documents. If any are absent from the
// types, this literal triggers excess-property errors.
const fullParams: CreateSubAccountParams = {
  business_type: 'BANKING',
  entity_type: 'INDIVIDUAL',
  nickname: 'TS Customer',
  individual_info: complete,
  identity_verification: {
    identification_type: 'PASSPORT',
    identification_value: 'E12345678',
    identity_docs: ['doc'],
    face_docs: ['doc'],
  },
  expected_activity: {
    account_purpose: ['PURCHASE'],
    banking_countries: ['SG'],
    banking_currencies: ['SGD'],
    internationally: 1,
    turnover_monthly: 'TM001',
    turnover_monthly_currency: 'USD',
  },
  proof_documents: {
    proof_of_address: ['doc'],
  },
  tos_acceptance: { ip: '203.0.113.42', date: '2026-06-24', user_agent: 'M' },
}

void fullParams

// COMPANY representative DOB is required and remains a YYYY-MM-DD string.
const _representativeDobRequired: IsRequiredIn<Representative, 'date_of_birth'> = true
const _representativeDob: Representative['date_of_birth'] = '1985-03-20'

void [_representativeDobRequired, _representativeDob]

// COMPANY requests with inherit=-1 must expose the full required contract.
const _representativeEmailRequired: IsRequiredIn<Representative, 'email_address'> = true
const _representativeOwnershipRequired: IsRequiredIn<Representative, 'ownership_percentage'> = true
const _representativeOwnershipIsString: Representative['ownership_percentage'] = '0'
const _accountPurposeRequired: IsRequiredIn<BusinessDetails, 'account_purpose'> = true
const _bankingCurrenciesRequired: IsRequiredIn<BusinessDetails, 'banking_currencies'> = true
const _bankingCountriesRequired: IsRequiredIn<BusinessDetails, 'banking_countries'> = true
const _articlesRequired: IsRequiredIn<BusinessDetails, 'articles_of_association'> = true

const companyBusinessDetails: BusinessDetails = {
  country_or_territory: 'SG',
  street_address: '1 Raffles Place',
  city: 'Singapore',
  postal_code: '048616',
  industry: '62010',
  account_purpose: ['PAYMENT_COLLECTION', 'TREASURY_FX'],
  banking_currencies: ['SGD'],
  banking_countries: ['SG'],
  articles_of_association: ['file-id'],
}

const companyRepresentative: Representative = {
  legal_first_name_english: 'Jane',
  legal_last_name_english: 'Doe',
  email_address: 'jane.doe@example.com',
  is_applicant: '1',
  job_title: 'Director',
  ownership_percentage: '0',
  nationality: 'SG',
  phone_number: '+6591234567',
  date_of_birth: '1985-03-20',
  country_or_territory: 'SG',
  street_address: '1 Raffles Place',
  city: 'Singapore',
  postal_code: '048616',
  identification_type: 'PASSPORT',
  identification_value: 'E12345678',
  identity_docs: ['file-id'],
}

const completeCompanyParams: CreateSubAccountParams = {
  business_type: 'BANKING',
  entity_type: 'COMPANY',
  inherit: -1,
  ownership_details: {
    representatives: [companyRepresentative],
  },
  business_details: companyBusinessDetails,
}

// @ts-expect-error COMPANY inherit=-1 requires ownership_details.
const companyMissingOwnershipDetails: CreateSubAccountParams = {
  business_type: 'BANKING',
  entity_type: 'COMPANY',
  inherit: -1,
  business_details: companyBusinessDetails,
}

// @ts-expect-error COMPANY inherit=-1 requires ownership_details.representatives.
const companyMissingRepresentatives: CreateSubAccountParams = {
  business_type: 'BANKING',
  entity_type: 'COMPANY',
  inherit: -1,
  ownership_details: {},
  business_details: companyBusinessDetails,
}

// @ts-expect-error COMPANY inherit=-1 requires business_details.
const companyMissingBusinessDetails: CreateSubAccountParams = {
  business_type: 'BANKING',
  entity_type: 'COMPANY',
  inherit: -1,
  ownership_details: {
    representatives: [companyRepresentative],
  },
}

// COMPANY inherit=1 is exempt from the non-inherited onboarding fields.
const inheritedCompanyParams: CreateSubAccountParams = {
  business_type: 'BANKING',
  entity_type: 'COMPANY',
  inherit: 1,
}

// Omitting COMPANY inherit follows the non-inherited contract.
const companyOmittedInheritParams: CreateSubAccountParams = {
  business_type: 'BANKING',
  entity_type: 'COMPANY',
  ownership_details: {
    representatives: [companyRepresentative],
  },
  business_details: companyBusinessDetails,
}

// @ts-expect-error COMPANY with omitted inherit still requires the non-inherited details.
const companyOmittedInheritMissingDetails: CreateSubAccountParams = {
  business_type: 'BANKING',
  entity_type: 'COMPANY',
}

const _supportedPurpose: CompanyAccountPurpose = 'GLOBAL_TRANSFER'
// @ts-expect-error INVESTMENT is rejected by the v3 COMPANY contract.
const _removedPurpose: CompanyAccountPurpose = 'INVESTMENT'

void [
  _representativeEmailRequired,
  _representativeOwnershipRequired,
  _representativeOwnershipIsString,
  _accountPurposeRequired,
  _bankingCurrenciesRequired,
  _bankingCountriesRequired,
  _articlesRequired,
  companyBusinessDetails,
  companyRepresentative,
  completeCompanyParams,
  companyMissingOwnershipDetails,
  companyMissingRepresentatives,
  companyMissingBusinessDetails,
  inheritedCompanyParams,
  companyOmittedInheritParams,
  companyOmittedInheritMissingDetails,
  _supportedPurpose,
  _removedPurpose,
]
