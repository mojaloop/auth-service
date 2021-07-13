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

 - Kevin Leyow <kevin.leyow@modusbox.com>
 --------------
 ******/
import { Request } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import ParticipantsTypeIDErrorHandler from '~/server/handlers/participants/{Type}/{ID}/error'
import { StateResponseToolkit } from '~/server/plugins/state'
import { RegisterConsentModel } from '~/model/registerConsent.model'
import { RegisterConsentPhase } from '~/model/registerConsent.interface'

jest.mock('~/domain/errors')

const errorInformationResponse = {
  headers: {
    'fspiop-source': 'als',
    'fspiop-destination': 'centralAuth'
  },
  params: {
    Type: 'CONSENT',
    ID: 'b82348b9-81f6-42ea-b5c4-80667d5740fe'
  },
  payload: {
    errorInformation: {
      errorCode: '3000',
      errorDescription: 'Some error code'
    }
  }
}

describe('server/handlers/consents', (): void => {
  it('Should return 200 success code', async (): Promise<void> => {
    jest.useFakeTimers()
    const request = errorInformationResponse
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
    const response = await ParticipantsTypeIDErrorHandler.put(
      null,
      request as unknown as Request,
      toolkit as unknown as StateResponseToolkit
    )

    expect(response.statusCode).toBe(Enum.Http.ReturnCodes.OK.CODE)
    jest.runAllImmediates()
    expect(toolkit.getPublisher).toBeCalledTimes(1)

    const channel = RegisterConsentModel.notificationChannel(
      RegisterConsentPhase.waitOnParticipantResponseFromALS,
      request.params.ID
    )
    expect(pubSubMock.publish).toBeCalledWith(channel, request.payload)
  })
})
