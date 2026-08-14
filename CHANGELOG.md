# Changelog

All notable changes to `@uqpay/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0]

This major release replaces the previous Virtual Account Create and webhook
contracts with the Virtual Account application lifecycle contract. Existing
Virtual Account integrations must migrate before adopting this version.

### Added

- Typed Virtual Account application summaries, complete application/result/error/
  bank-detail models, and separate list/retrieve application resources.
- Typed application-level `virtual.account.create`, `virtual.account.update`, and
  `virtual.account.closed` webhook events with `public_version` ordering.

### Changed

- Webhook freshness validation accepts Webhook Hub's Unix-millisecond
  `x-wk-timestamp` while retaining Unix-second compatibility and signing the
  unmodified header value.
- Create Virtual Account now requires `country`, accepts one `currency`, optional
  `LOCAL`/`SWIFT`/omitted method and nickname, and returns application data.
- Create Virtual Account continues to forward `x-idempotency-key`; caller-supplied
  values now follow the endpoint's opaque 1-64 character contract. Other
  endpoints retain UUID-v4 validation and generated keys remain UUID v4.
- HTTP 400 application concealment errors with `type=not_found` map to
  `NotFoundError` without changing their type, code, message, or HTTP status.

### Fixed

- Restored the required webhook-only `account_id` and `direct_id` fields on
  Virtual Account application events for `virtual.account.create`,
  `virtual.account.update`, and `virtual.account.closed` across Hub versions
  `V1.5.1`, `V1.5.2`, and `V1.6.0`. REST public types remain unchanged pending a
  published Developer Docs contract, even though current Sandbox payloads may
  already contain these fields. Archived pre-restoration payloads can be typed
  explicitly with `LegacyVirtualAccountApplicationWebhookEvent`.

### Breaking

- Existing Create Virtual Account callers must add `country`, replace a currency
  list with one `currency`, and parse HTTP 200 application data instead of the
  previous HTTP 202 `message` and `request_id` response.
- Virtual Account webhook consumers must correlate by `application_id`, process
  complete application data, and use `public_version` for ordering.

### Migration

- Install with `npm install @uqpay/sdk@2.0.0` and follow the
  [Virtual Account migration guide](https://developers.uqpay.com/global-account/v1.6/guide/migrate-to-virtual-account-applications).

## [1.2.0]

This bootstrap alignment release establishes the shared stable `1.2` capability
baseline used by all five UQPAY customer SDKs. It covers all 98 callable operations
in the current business API contract; Ramp remains outside the SDK product scope.

### Added

- Connect RFI list, retrieve, and answer resources.
- Issuing card limit, risk, PIN, ART, merchant-brand, and unsolicited-refund
  release operations.
- Payment terminal registration and PIN-key operations.
- Typed webhook event names for the shared webhook envelope.

### Changed

- Node.js 22 or newer is now required (previously Node.js 20).
- The package now follows the stable `1.x` public API compatibility policy.

### Migration

- Upgrade the runtime before installing this version: `npm install @uqpay/sdk@1.2.0`.
- Code assigning arbitrary strings to `UQPayWebhookEvent.event_name` must use one
  of the exported `WebhookEventName` values.

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
