import { describe, it, expect } from 'vitest'
import { generateIdempotencyKey, validateIdempotencyKey } from '../src/idempotency.js'
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

  it('rejects UUID v1', () => {
    expect(() => validateIdempotencyKey('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toThrow(InvalidIdempotencyKeyError)
    expect(() => validateIdempotencyKey('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toThrow(/UUID v4/)
  })

  it('rejects arbitrary string', () => {
    expect(() => validateIdempotencyKey('not-a-uuid')).toThrow(InvalidIdempotencyKeyError)
    expect(() => validateIdempotencyKey('not-a-uuid')).toThrow(/UUID v4/)
  })

  it('rejects empty string', () => {
    expect(() => validateIdempotencyKey('')).toThrow(InvalidIdempotencyKeyError)
  })
})
