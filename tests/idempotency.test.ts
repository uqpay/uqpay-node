import { describe, it, expect } from 'vitest'
import { generateIdempotencyKey, validateIdempotencyKey, validateOpaqueIdempotencyKey } from '../src/idempotency.js'
import { InvalidIdempotencyKeyError } from '../src/error.js'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('generateIdempotencyKey', () => {
  it('generates a valid UUID v4', () => {
    const key = generateIdempotencyKey()
    expect(UUID_V4_REGEX.test(key)).toBe(true)
  })

  it('generates unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateIdempotencyKey()))
    expect(keys.size).toBe(100)
  })
})

describe('validateIdempotencyKey', () => {
  it('accepts valid UUID v4', () => {
    expect(() => validateIdempotencyKey('550e8400-e29b-41d4-a716-446655440000')).not.toThrow()
  })

  it('rejects arbitrary strings for endpoints whose contract requires UUID v4', () => {
    expect(() => validateIdempotencyKey('va-application-retry-001')).toThrow(/UUID v4/)
  })

  it('rejects empty string', () => {
    expect(() => validateIdempotencyKey('')).toThrow(InvalidIdempotencyKeyError)
  })

})

describe('validateOpaqueIdempotencyKey', () => {
  it('accepts a VA application retry key', () => {
    expect(() => validateOpaqueIdempotencyKey('va-application-retry-001')).not.toThrow()
  })

  it('rejects empty and over-64-character keys', () => {
    expect(() => validateOpaqueIdempotencyKey('')).toThrow(InvalidIdempotencyKeyError)
    expect(() => validateOpaqueIdempotencyKey('x'.repeat(65))).toThrow(/1 and 64/)
  })
})
