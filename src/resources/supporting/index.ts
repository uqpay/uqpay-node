import type { HttpClient } from '../../http.js'
import { FilesResource } from './files.js'

export class SupportingResource {
  readonly files: FilesResource

  constructor(http: HttpClient, fileBaseUrl: string) {
    this.files = new FilesResource(http, fileBaseUrl)
  }
}

export * from './types.js'
