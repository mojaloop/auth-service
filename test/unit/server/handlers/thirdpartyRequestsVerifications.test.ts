/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop
 files are distributed onan 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 ANY KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
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

 - Lewis Daly <lewisd@crosslaketech.com>
 --------------
 ******/

import { Request } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import thirdpartyRequestsVerificationsHandler from '~/server/handlers/thirdpartyRequestsVerifications'
import { StateResponseToolkit } from '~/server/plugins/state'

const flushPromises = () => new Promise(setImmediate);
const mockRun = jest.fn()

jest.mock('~/domain/stateMachine/verifyTransaction.model', () => ({
  VerifyTransactionModel: {
    // notificationChannel: jest.fn(() => 'the-mocked-channel')
  },
  create: jest.fn(async () => ({
    // this result will be tested
    run: mockRun
  }))
}))

const PostThirdpartyRequestsVerificationsRequest = {
  headers: {

  },
  params: {},
  payload: {
    //TODO:
  }
}

describe('POST /thirdpartyRequests/verifications', (): void => {
  it('should return 202 synchronously', async () => {
    //Arrange
    // jest.useFakeTimers()
    const pubSubMock = {
      subscribe: jest.fn()
    }
    const toolkit = {
      getSubscriber: jest.fn(() => pubSubMock),
      response: jest.fn(() => ({
        code: jest.fn((code: number) => ({
          statusCode: code
        }))
      })),
      getDFSPId: jest.fn(() => 'centralAuth'),
      getThirdpartyRequests: jest.fn(() => ({
        putConsents: jest.fn(),
        putConsentsError: jest.fn()
      })),
      getMojaloopRequests: jest.fn(),
      getKVS: jest.fn(() => ({
        set: jest.fn()
      }))
    }
    
    // Act
    const response = await thirdpartyRequestsVerificationsHandler.post(
      null,
      PostThirdpartyRequestsVerificationsRequest as unknown as Request,
      toolkit as unknown as StateResponseToolkit
    )
    
    // Assert
    expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)
    // Wait out any other promises
    await flushPromises()
    expect(mockRun).toHaveBeenCalledTimes(1)
  })
})