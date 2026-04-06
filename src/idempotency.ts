import { randomUUID } from 'node:crypto'
import { InvalidIdempotencyKeyError } from './error.js'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function generateIdempotencyKey(): string {
  return randomUUID()
}

/** Validates that a caller-supplied key is UUID v4. Throws InvalidIdempotencyKeyError if not. */
export function validateIdempotencyKey(key: string): void {
  if (!UUID_V4_REGEX.test(key)) {
    throw new InvalidIdempotencyKeyError(key)
  }
}
