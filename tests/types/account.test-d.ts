// Type-level regression test, checked by `npm run test:types` (tsc --noEmit).
//
// IndividualInfo must mirror the required fields of ACCOUNTCENTER_IndividualInfo
// in account-center/v1.6/connect.yaml. Two breaking changes added required
// fields the SDK never picked up:
//   - 2026-03-19: employment_status, industry, job_title, company_name
//   - 2026-07-02: gender, annual_income
// Missing any of these makes Create SubAccount reject INDIVIDUAL requests.
import type { IndividualInfo } from '../../src/resources/account/types.js'

// Keys of T that are present AND non-optional.
type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

// `true` only if K is a required key of IndividualInfo; otherwise `never`,
// which makes the `const ... : Assert<...> = true` line a compile error.
type IsRequired<K extends string> = K extends RequiredKeys<IndividualInfo> ? true : never

const _firstNameEnglish: IsRequired<'first_name_english'> = true
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
  _firstNameEnglish, _state, _employmentStatus, _industry, _jobTitle,
  _companyName, _gender, _annualIncome, _genderMale, _genderFemale, complete,
]
