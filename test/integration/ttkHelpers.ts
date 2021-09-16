export interface MLTestingToolkitRequest {
  timestamp: string
  method: string
  path: string
  headers: Record<string, unknown>
  body: Record<string, unknown>
}