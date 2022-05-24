import index from '~/index'
import Config from '~/shared/config'
import { Server } from '@hapi/hapi'

describe('/health', () => {
  let server: Server

  beforeAll(async (): Promise<void> => {
    server = await index.server.run(Config)
  })
  afterAll(async (): Promise<void> => {
    server.stop({ timeout: 0 })
  })

  it('should work', async (): Promise<void> => {
    interface HealthResponse {
      status: string
      uptime: number
      startTime: string
      versionNumber: string
    }

    const request = {
      method: 'GET',
      url: '/health'
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(200)
    expect(response.result).toBeDefined()

    const result = response.result as HealthResponse
    expect(result.status).toEqual('OK')
    expect(result.uptime).toBeGreaterThan(1.0)
  })
})
