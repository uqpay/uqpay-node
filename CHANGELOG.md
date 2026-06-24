# Changelog

All notable changes to `@uqpay/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1]

### Added

- **Account Center — Create SubAccount (`INDIVIDUAL`):** the create types could not
  express several fields the API requires, so a TypeScript caller could not build a
  valid individual sub-account payload without `as any`. Added (all additive):
  - `CreateSubAccountParams.proof_documents` (`proof_of_address` required; optional
    `source_of_funds`, `proof_of_position_and_income`, `other_proof`).
  - `IdentityVerification.face_docs` (mandatory for individuals).
  - `expected_activity` now also accepts `internationally`, `turnover_monthly`,
    `turnover_monthly_currency`, and `other_purpose`.

## [0.3.0]

### Fixed

- **Account Center — Create SubAccount (`INDIVIDUAL`):** `IndividualInfo` was missing
  required fields, so the SDK could not express a valid individual sub-account and
  the API rejected requests. Added the fields the API requires:
  - `gender` (`'MALE' | 'FEMALE'`) and `annual_income` — required effective 2026-07-02.
  - `employment_status`, `industry`, `job_title`, `company_name` — required effective 2026-03-19.
  - `state` is now required (previously optional), matching the spec.
  - Added optional `apartment_suite_or_floor`.

### Added

- Exported `IndividualGender` and `IndividualEmploymentStatus` types.
- Type-level regression tests (`tests/types/*.test-d.ts`) run via `npm run test:types`
  to catch request/response types drifting from the API spec.

### Breaking

- TypeScript consumers constructing `IndividualInfo` must now supply the newly
  required fields. This corrects code that previously could not compile a valid
  payload without `as any`.
