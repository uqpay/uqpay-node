// ─── Upload File ──────────────────────────────────────────────────────────────

export interface UploadFileResponse {
  file_id: string
  file_name: string
  file_type: string
  size: number
  create_time: string
  notes?: string
}

export interface UploadFileOptions {
  /** Filename to use in the multipart form (e.g. 'photo.jpg'). Defaults to 'file'. */
  filename?: string
  /** MIME type of the file. Defaults to 'application/octet-stream'. */
  mimeType?: string
  /** Optional note attached to the file. Max 50 characters. */
  notes?: string
}

// ─── Download Links ───────────────────────────────────────────────────────────

export interface DownloadLinksResponse {
  files: DownloadFileInfo[]
  absent_files: string[]
}

export interface DownloadFileInfo {
  file_id: string
  file_name: string
  file_type: string
  size: number
  url: string
}
