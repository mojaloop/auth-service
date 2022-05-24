import index from '~/index'
import Config from '~/shared/config'
import { Server } from '@hapi/hapi'

describe('/metrics', () => {
  let server: Server

  beforeAll(async (): Promise<void> => {
    server = await index.server.run(Config)
  })
  afterAll(async (): Promise<void> => {
    server.stop({ timeout: 0 })
  })

  it('should work', async (): Promise<void> => {
    const request = {
      method: 'GET',
      url: '/metrics'
    }

    const response = await server.inject(request)
    expect(response.statusCode).toBe(200)
    expect(response.result).toBeDefined()
  })
})
