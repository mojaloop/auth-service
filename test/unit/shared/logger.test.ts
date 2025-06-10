/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 - Paweł Marzec <pawel.marzec@modusbox.com>

 --------------
 ******/

import { RequestLogged, logResponse, logger, createLogger } from '~/shared/logger'
// import { Logger as SDKLogger } from '@mojaloop/sdk-standard-components'
import inspect from '~/shared/inspect'
// import { Logger as SDKLogger } from '@mojaloop/sdk-standard-components'

// import SDK from '@mojaloop/sdk-standard-components'

jest.mock('@mojaloop/sdk-standard-components', () => ({
  Logger: {
    loggerFactory: jest.fn(() => ({
      push: jest.fn(),
      log: jest.fn(),
      silly: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      perf: jest.fn(),
      info: jest.fn(),
      trace: jest.fn(),
      audit: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}))

describe('shared/logger', (): void => {
  it('should do nothing if no request', (): void => {
    logResponse(null as unknown as RequestLogged)
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('should log response via JSON.stringify', (): void => {
    const spyStringify = jest.spyOn(JSON, 'stringify')
    const request = { response: { source: 'abc', statusCode: 200 } }
    logResponse(request as RequestLogged)
    expect(spyStringify).toHaveBeenCalledWith('abc')
    expect(logger.info).toHaveBeenCalledWith(
      `AS-Trace - Response: ${JSON.stringify(request.response.source)} Status: ${request.response.statusCode}`
    )
  })

  it('should log response via inspect', (): void => {
    jest.mock('~/shared/inspect', () => jest.fn())

    const spyStringify = jest.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
      throw new Error('parse-error')
    })

    const request = { response: { source: 'abc', statusCode: 200 } }
    logResponse(request as RequestLogged)
    expect(spyStringify).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(
      `AS-Trace - Response: ${inspect(request.response.source)} Status: ${request.response.statusCode}`
    )
  })

  it('should log if there is no request.response', (): void => {
    const spyStringify = jest.spyOn(JSON, 'stringify').mockImplementationOnce(() => null as unknown as string)
    const request = { response: { source: 'abc', statusCode: 200 } }
    logResponse(request as RequestLogged)
    expect(spyStringify).toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledWith(`AS-Trace - Response: ${request.response.toString()}`)
  })

  describe('Logger class', () => {
    it('should be able to create default logger', () => {
      const log = createLogger()
      // basic methods
      expect(typeof log.push).toEqual('function')
      // log methods
      expect(typeof log.log).toEqual('function')
      // generated methods from default levels
      expect(typeof log.silly).toEqual('function')
      expect(typeof log.debug).toEqual('function')
      expect(typeof log.verbose).toEqual('function')
      expect(typeof log.perf).toEqual('function')
      expect(typeof log.info).toEqual('function')
      expect(typeof log.trace).toEqual('function')
      expect(typeof log.audit).toEqual('function')
      expect(typeof log.warn).toEqual('function')
      expect(typeof log.error).toEqual('function')
    })
  })

  describe('logger default instance', () => {
    it('should have proper layout', () => {
      //InboundContextLogger methods
      expect(typeof logger.push).toEqual('function')
      // log methods
      expect(typeof logger.log).toEqual('function')
      // generated methods from default levels
      expect(typeof logger.silly).toEqual('function')
      expect(typeof logger.debug).toEqual('function')
      expect(typeof logger.verbose).toEqual('function')
      expect(typeof logger.perf).toEqual('function')
      expect(typeof logger.info).toEqual('function')
      expect(typeof logger.trace).toEqual('function')
      expect(typeof logger.audit).toEqual('function')
      expect(typeof logger.warn).toEqual('function')
      expect(typeof logger.error).toEqual('function')
    })
  })
})
