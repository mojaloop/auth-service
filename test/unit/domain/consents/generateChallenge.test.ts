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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import { consentDB } from '~/lib/db'
import { Consent } from '~/model/consent'
import { Enum } from '@mojaloop/central-services-shared'
import { PutConsentsRequest } from '@mojaloop/sdk-standard-components'
import { logger } from '~/shared/logger'
import {
  externalScopes, request,
  credentialPending, partialConsentActive, completeConsentActiveNoCredentialID
} from '~/../test/data/data'
import {
  updateConsentCredential,
  generatePutConsentsRequest
} from '~/domain/consents/generateChallenge'
import * as DomainError from '~/domain/errors'
import { mocked } from 'ts-jest/utils'

jest.mock('~/shared/logger')

// Declaring Mock Functions
const mockConsentDbUpdate = jest.spyOn(consentDB, 'update')

const putConsentRequestBody: PutConsentsRequest = {
  requestId: 'b51ec534-ee48-4575-b6a9-ead2955b8069',
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
  beforeEach((): void => {
    jest.clearAllMocks()
  })

  // Tests for updateConsentCredential
  describe('Updating Consent successfully', (): void => {
    // eslint-disable-next-line max-len
    it('Should return a consent object with filled out credentials', async (): Promise<void> => {
      mockConsentDbUpdate.mockResolvedValueOnce(3)

      const updatedConsent = await updateConsentCredential(
        partialConsentActive, credentialPending)

      expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsentActiveNoCredentialID)
      expect(updatedConsent).toEqual(completeConsentActiveNoCredentialID)
    })

    // eslint-disable-next-line max-len
    it('Should propagate error in updating credentials in database', async (): Promise<void> => {
      const testError = new Error('Error updating Database')
      mockConsentDbUpdate.mockRejectedValue(testError)

      await expect(updateConsentCredential(partialConsentActive, credentialPending))
        .rejects
        .toThrowError(new DomainError.DatabaseError(completeConsentActiveNoCredentialID.id))

      expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsentActiveNoCredentialID)
      expect(mocked(logger.error)).toHaveBeenCalled()
      expect(mocked(logger.push)).toHaveBeenLastCalledWith({ error: testError })
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
