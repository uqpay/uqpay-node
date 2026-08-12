import { randomUUID } from 'node:crypto'
import { InvalidIdempotencyKeyError } from './error.js'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function generateIdempotencyKey(): string {
  return randomUUID()
}

/** Validates the shared API UUID-v4 idempotency-key contract. */
export function validateIdempotencyKey(key: string): void {
  if (!UUID_V4_REGEX.test(key)) {
    throw new InvalidIdempotencyKeyError(key)
  }
}

/** Validates endpoints (such as VA Create) that accept an opaque key up to 64 characters. */
export function validateOpaqueIdempotencyKey(key: string): void {
  if (key.length === 0 || key.length > 64) {
    throw new InvalidIdempotencyKeyError(key, 'opaque-max-64')
  }
}
