import { describe, it, expect, vi } from 'vitest'
import { HttpClient } from '../../src/http.js'
import { TokenManager } from '../../src/auth.js'
import { Logger } from '../../src/logger.js'
import { SupportingResource } from '../../src/resources/supporting/index.js'

const FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  Buffer.from(JSON.stringify({ entity_id: 'a1', short_entity_id: 'CB001', parent_entity_id: '0', client_id: 'c1', api_version: 'V1.0', bus_type: 'BANKING', exp: 9999999999 })).toString('base64url'),
  'sig',
].join('.')

function makeClient(apiFetch: typeof globalThis.fetch) {
  const tokenFetch = vi.fn().mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ auth_token: FAKE_JWT, expired_at: 9999999999 }),
  })
  const tm = new TokenManager('cid', 'key', 'https://api.example.com', tokenFetch)
  const http = new HttpClient('https://api.example.com', tm, new Logger('none'), 'c1', '0.1.0', 30_000, apiFetch)
  return new SupportingResource(http, 'https://files.example.com')
}

describe('SupportingResource', () => {
  describe('files.upload', () => {
    it('sends multipart/form-data to file base URL', async () => {
      const apiFetch = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          file_id: 'abc-123', file_name: 'test.jpg', file_type: 'jpg',
          size: 1234, create_time: '2024-01-01T00:00:00Z', notes: '',
        }),
        text: async () => '{}',
      })

      const resource = makeClient(apiFetch)
      const blob = new Blob(['fake image data'], { type: 'image/jpeg' })
      const result = await resource.files.upload(blob, { filename: 'test.jpg' })

      expect(result.file_id).toBe('abc-123')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('https://files.example.com')
      expect(url).toContain('/v1/files/upload')

      // Must NOT set Content-Type manually (fetch sets multipart boundary)
      const headers = apiFetch.mock.calls[0]?.[1]?.headers as Record<string, string>
      expect(headers?.['Content-Type']).toBeUndefined()

      // Body must be FormData
      const body = apiFetch.mock.calls[0]?.[1]?.body
      expect(body).toBeInstanceOf(FormData)
    })

    it('appends notes as query param when provided', async () => {
      const apiFetch = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ file_id: 'abc-123', file_name: 'test.jpg', file_type: 'jpg', size: 1234, create_time: '2024-01-01T00:00:00Z', notes: 'my note' }),
        text: async () => '{}',
      })

      const resource = makeClient(apiFetch)
      const blob = new Blob(['data'], { type: 'image/jpeg' })
      await resource.files.upload(blob, { filename: 'test.jpg', notes: 'my note' })

      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('notes=my+note')
    })
  })

  describe('files.downloadLinks', () => {
    it('sends POST with file_ids array', async () => {
      const apiFetch = vi.fn().mockResolvedValue({
        ok: true, status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          files: [{ file_id: 'abc-123', file_name: 'test.jpg', file_type: 'jpg', size: 1234, url: 'https://example.com/file' }],
          absent_files: [],
        }),
        text: async () => '{}',
      })

      const resource = makeClient(apiFetch)
      const result = await resource.files.downloadLinks(['abc-123'])

      expect(result.files[0]?.file_id).toBe('abc-123')
      const url = apiFetch.mock.calls[0]?.[0] as string
      expect(url).toContain('/v1/files/download_links')
      expect(url).toContain('https://files.example.com')
    })
  })
})
