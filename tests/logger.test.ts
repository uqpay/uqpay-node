import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Logger } from '../src/logger.js'

describe('Logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('logs nothing at level none', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = new Logger('none')
    logger.info('POST', '/foo', 200, 100, 'key1')
    expect(spy).not.toHaveBeenCalled()
  })

  it('logs at info level', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const logger = new Logger('info')
    logger.info('POST', '/api/v1/foo', 200, 123, 'key1', 'CB89049')
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('POST /api/v1/foo → 200')
    )
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('123ms'))
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('key1'))
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('CB89049'))
  })

  it('redacts sensitive fields in debug body', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const logger = new Logger('debug')
    logger.debug('POST', '/api/v1/foo', 200, 10, 'k', undefined, 0, {
      card_number: '4111111111111111',
      cvc: '123',
      amount: '10.00',
    }, null)
    const call = spy.mock.calls[0]?.[0] as string
    expect(call).not.toContain('4111111111111111')
    expect(call).not.toContain('123')
    expect(call).toContain('****')
    expect(call).toContain('amount')
  })

  it('redacts custom fields', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const logger = new Logger('debug', ['my_secret'])
    logger.debug('GET', '/foo', 200, 5, 'k', undefined, 0, { my_secret: 'abc', safe: 'xyz' }, null)
    const call = spy.mock.calls[0]?.[0] as string
    expect(call).not.toContain('abc')
    expect(call).toContain('****')
    expect(call).toContain('xyz')
  })
})
