/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>

 --------------
 ******/
import { consentDB } from '~/lib/db'
import { Consent } from '~/model/consent'
import { Enum } from '@mojaloop/central-services-shared'
import Logger from '@mojaloop/central-services-logger'
import { PutConsentsRequest } from '@mojaloop/sdk-standard-components'
import {
  externalScopes, request,
  credential, partialConsentActive, completeConsentActiveNoCredentialID
} from '../../data/data'
import {
  updateConsentCredential,
  generatePutConsentsRequest
} from '~/domain/consents/generateChallenge'

// Declaring Mock Functions
const mockConsentDbUpdate = jest.spyOn(consentDB, 'update')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

const putConsentRequestBody: PutConsentsRequest = {
  requestId: '1234',
  initiatorId: completeConsentActiveNoCredentialID.initiatorId as string,
  participantId: completeConsentActiveNoCredentialID.participantId as string,
  scopes: externalScopes,
  credential: {
    id: null,
    credentialType: 'FIDO',
    status: 'PENDING',
    challenge: {
      payload: completeConsentActiveNoCredentialID.credentialChallenge as string,
      signature: null
    },
    payload: null
  }
}

describe('Tests for src/domain/consents/{ID}/generateChallenge', (): void => {
  beforeAll((): void => {
    mockLoggerError.mockReturnValue(null)
    mockLoggerPush.mockReturnValue(null)
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  // Tests for updateConsentCredential
  describe('Updating Consent successfully', (): void => {
    // eslint-disable-next-line max-len
    it('Should return a consent object with filled out credentials', async (): Promise<void> => {
      mockConsentDbUpdate.mockResolvedValueOnce(3)

      const updatedConsent = await updateConsentCredential(
        partialConsentActive, credential)

      expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsentActiveNoCredentialID)
      expect(updatedConsent).toEqual(completeConsentActiveNoCredentialID)
    })

    // eslint-disable-next-line max-len
    it('Should propagate error in updating credentials in database', async (): Promise<void> => {
      mockConsentDbUpdate.mockRejectedValue(
        new Error('Error updating Database'))

      await expect(updateConsentCredential(partialConsentActive, credential))
        .rejects
        .toThrowError('Error updating Database')

      expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsentActiveNoCredentialID)
    })
  })

  // Tests for putConsentId
  describe('Requests', (): void => {
    beforeAll((): void => {
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = '1234'
      request.headers[Enum.Http.Headers.FSPIOP.DESTINATION] = '5678'
    })

    it('Should resolve successfully', async (): Promise<void> => {
      expect(await generatePutConsentsRequest(completeConsentActiveNoCredentialID, externalScopes))
        .toStrictEqual(putConsentRequestBody)
    })

    it('Should throw an error as consent is null value',
      async (): Promise<void> => {
        await expect(generatePutConsentsRequest(
          null as unknown as Consent, externalScopes))
          .rejects
          .toThrow()
      }
    )
  })
}
)
