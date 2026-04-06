import { BaseResource } from '../base.js'
import type { RequestOptions } from '../../types/common.js'
import type { UploadFileResponse, UploadFileOptions, DownloadLinksResponse } from './types.js'

export class FilesResource extends BaseResource {
  constructor(
    http: ConstructorParameters<typeof BaseResource>[0],
    private readonly fileBaseUrl: string
  ) {
    super(http)
  }

  /**
   * Upload a file to UQPay. Max 20MB.
   * Supported formats: jpeg, png, jpg, doc, docx, pdf.
   * Returns a file_id for use in other API calls.
   * POST /v1/files/upload
   */
  async upload(
    file: Blob | ArrayBuffer | Uint8Array,
    uploadOptions: UploadFileOptions = {},
    options?: RequestOptions
  ): Promise<UploadFileResponse> {
    const { filename = 'file', mimeType = 'application/octet-stream', notes } = uploadOptions
    const blob = file instanceof Blob ? file : new Blob([file as BlobPart], { type: mimeType })
    const form = new FormData()
    form.append('file', blob, filename)
    const path = notes
      ? `/v1/files/upload?${new URLSearchParams({ notes }).toString()}`
      : '/v1/files/upload'
    return this.http.request<UploadFileResponse>(
      { method: 'POST', path, formData: form, baseUrl: this.fileBaseUrl },
      options
    )
  }

  /**
   * Get temporary download links for a list of file IDs.
   * POST /v1/files/download_links
   */
  downloadLinks(fileIds: string[], options?: RequestOptions): Promise<DownloadLinksResponse> {
    return this.http.request<DownloadLinksResponse>(
      { method: 'POST', path: '/v1/files/download_links', body: { file_ids: fileIds }, baseUrl: this.fileBaseUrl },
      options
    )
  }
}
