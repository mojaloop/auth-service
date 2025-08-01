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

 - Kevin Leyow <kevin.leyow@modusbox.com>
 --------------
 ******/
import { Request } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import ParticipantsTypeIDHandler from '~/server/handlers/participants/{Type}/{ID}'
import { StateResponseToolkit } from '~/server/plugins/state'
import { RegisterConsentModel } from '~/domain/stateMachine/registerConsent.model'
import { RegisterConsentPhase } from '~/domain/stateMachine/registerConsent.interface'

jest.mock('~/domain/errors')

const participantsTypeIDPutResponse = {
  headers: {
    'fspiop-source': 'als',
    'fspiop-destination': 'centralAuth'
  },
  params: {
    Type: 'CONSENT',
    ID: 'b82348b9-81f6-42ea-b5c4-80667d5740fe'
  },
  payload: {
    fspId: 'centralAuth'
  }
}

describe('server/handlers/consents', (): void => {
  it('Should return 200 success code', async (): Promise<void> => {
    jest.useFakeTimers({ legacyFakeTimers: true })
    const request = participantsTypeIDPutResponse
    const pubSubMock = {
      publish: jest.fn()
    }
    const toolkit = {
      getPublisher: jest.fn(() => pubSubMock),
      response: jest.fn(() => ({
        code: jest.fn((code: number) => ({
          statusCode: code
        }))
      }))
    }

    const response = await ParticipantsTypeIDHandler.put(
      null,
      request as unknown as Request,
      toolkit as unknown as StateResponseToolkit
    )

    expect(response.statusCode).toBe(Enum.Http.ReturnCodes.OK.CODE)
    jest.runAllImmediates()
    expect(toolkit.getPublisher).toHaveBeenCalledTimes(1)

    const channel = RegisterConsentModel.notificationChannel(
      RegisterConsentPhase.waitOnParticipantResponseFromALS,
      request.params.ID
    )
    expect(pubSubMock.publish).toHaveBeenCalledWith(channel, request.payload)
  })
})
