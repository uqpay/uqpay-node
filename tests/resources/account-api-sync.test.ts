import { describe, it, expect } from 'vitest'
import type { Representative, CreateAccountBusinessDetails } from '../../src/index.js'

describe('account optional supporting documents', () => {
  it('accepts optional representative face documents and individual merchants', () => {
    const documents = { face_docs: ['file-synthetic'] } satisfies Pick<Representative, 'face_docs'>
    const omitted = {} satisfies Pick<Representative, 'face_docs'>
    const structure: CreateAccountBusinessDetails['business_structure'] = 'INDIVIDUAL_MERCHANT'
    expect(JSON.parse(JSON.stringify(documents))).toEqual({ face_docs: ['file-synthetic'] })
    expect(omitted).not.toHaveProperty('face_docs')
    expect(structure).toBe('INDIVIDUAL_MERCHANT')
  })
})
