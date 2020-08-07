import path from 'path'
import { loadFeature, defineFeature } from 'jest-cucumber'
import { Server, ServerInjectResponse } from '@hapi/hapi'
import Config from '~/shared/config'

import AuthService from '../../src/server'

const featurePath = path.join(__dirname, '../features/template.scenario.feature')
const feature = loadFeature(featurePath)

defineFeature(feature, (test): void => {
  let server: Server
  let response: ServerInjectResponse

  afterEach((done): void => {
    server.events.on('stop', done)
    server.stop()
  })

  test('Health Check', ({ given, when, then }): void => {
    given('auth-service server', async (): Promise<Server> => {
      server = await AuthService.run(Config)
      return server
    })

    when('I get \'Health Check\' response', async (): Promise<ServerInjectResponse> => {
      const request = {
        method: 'GET',
        url: '/health'
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      interface HealthResponse {
        status: string;
        uptime: number;
        startTime: string;
        versionNumber: string;
      }
      const healthResponse = response.result as HealthResponse
      expect(response.statusCode).toBe(200)
      expect(healthResponse.status).toEqual('OK')
      expect(healthResponse.uptime).toBeGreaterThan(1.0)
    })
  })

  test('Hello', ({ given, when, then }): void => {
    given('auth-service server', async (): Promise<Server> => {
      server = await AuthService.run(Config)
      return server
    })

    when('I get \'Hello\' response', async (): Promise<ServerInjectResponse> => {
      const request = {
        method: 'GET',
        url: '/hello'
      }
      response = await server.inject(request)
      return response
    })

    then('I see \'Hello world\'', (): void => {
      expect(response.statusCode).toBe(200)
      expect(response.result).toEqual({ hello: 'world' })
    })
  })
})
