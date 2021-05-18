/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License")
 and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed
 on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Paweł Marzec <pawel.marzec@modusbox.com>

 --------------
 ******/

import { StatePlugin } from '~/server/plugins/state'
import { Server } from '@hapi/hapi'
import { mockProcessExit } from 'jest-mock-process'

import SDK from '@mojaloop/sdk-standard-components'
import config from '~/shared/config'
import { logger } from '~/shared/logger'

jest.mock('~/shared/logger')

describe('StatePlugin', () => {
  const ServerMock = {
    events: {
      on: jest.fn()
    },
    decorate: jest.fn(),
    settings: {}
  }

  it('should have proper layout', () => {
    expect(typeof StatePlugin.name).toEqual('string')
    expect(typeof StatePlugin.version).toEqual('string')
    expect(StatePlugin.once).toBeTruthy()
    expect(StatePlugin.register).toBeInstanceOf(Function)
  })

  it('happy flow: should properly register', async () => {
    await StatePlugin.register(ServerMock as unknown as Server)

    // check decoration
    expect(ServerMock.decorate)
    expect(ServerMock.decorate.mock.calls[0][1]).toEqual('getLogger')
    expect(ServerMock.decorate.mock.calls[0][0]).toEqual('toolkit')
    expect(ServerMock.decorate.mock.calls[1][1]).toEqual('getMojaloopRequests')
    expect(ServerMock.decorate.mock.calls[1][0]).toEqual('toolkit')
    expect(ServerMock.decorate.mock.calls[2][1]).toEqual('getThirdpartyRequests')
    expect(ServerMock.decorate.mock.calls[2][0]).toEqual('toolkit')
    expect(ServerMock.decorate.mock.calls[3][1]).toEqual('getWSO2Auth')
    expect(ServerMock.decorate.mock.calls[3][0]).toEqual('toolkit')
  })

  it('exceptions: should properly register', async () => {
    const mockExit = mockProcessExit()
    ServerMock.decorate.mockImplementationOnce(() => { throw new Error('decorate error') })
    await StatePlugin.register(ServerMock as unknown as Server)
    expect(mockExit).toBeCalledWith(1)
    mockExit.mockRestore()
  })

  it('should prepare WSO2Auth with tlsCreds', async () => {
    const spyWSO2Auth = jest.spyOn(SDK, 'WSO2Auth').mockImplementationOnce(
      () => ({ Iam: 'mockedWSO2Auth' } as unknown as SDK.WSO2Auth)
    )
    config.SHARED.TLS.mutualTLS.enabled = true
    config.SHARED.TLS.creds = {
      ca: 'mocked ca',
      cert: 'mocked cert',
      key: 'mocked key'
    }
    await StatePlugin.register(ServerMock as unknown as Server)
    expect(spyWSO2Auth).toBeCalledWith({
      ...config.SHARED.WSO2_AUTH,
      logger,
      tlsCreds: config.SHARED.TLS.creds
    })
    config.SHARED.TLS.mutualTLS.enabled = false
  })
})
