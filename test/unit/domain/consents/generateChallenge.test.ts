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
import { Request } from '@hapi/hapi'
import { consentDB } from '~/lib/db'
import { Consent } from '~/model/consent'
import { Enum } from '@mojaloop/central-services-shared'
import Logger from '@mojaloop/central-services-logger'
import { PutConsentsRequest } from '@mojaloop/sdk-standard-components'
import { ExternalScope } from '~/lib/scopes'
import {
  updateConsentCredential,
  isConsentRequestInitiatedByValidSource,
  generatePutConsentsRequest
} from '~/domain/consents/generateChallenge'

// Declaring Mock Functions
const mockConsentDbUpdate = jest.spyOn(consentDB, 'update')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

/*
 * Mock Request Resources
 */
// @ts-ignore
const request: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    id: '1234'
  }
}

// @ts-ignore
const requestNoHeaders: Request = {
  params: {
    id: '1234'
  }
}

/*
 * Mock Consent Resources
 */
const partialConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123'
}

const partialConsent2: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2234',
  participantId: 'dfsp-3333-2123'
}

const completeConsent: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

const credential = {
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs=',
  credentialPayload: null
}

// const challenge = 'xyhdushsoa82w92mzs='

const externalScopes: ExternalScope[] = [{
  accountId: 'as2342',
  actions: ['account.getAccess', 'account.transferMoney']
},
{
  accountId: 'as22',
  actions: ['account.getAccess']
}
]

const putConsentRequestBody: PutConsentsRequest = {
  requestId: '1234',
  initiatorId: completeConsent.initiatorId as string,
  participantId: completeConsent.participantId as string,
  scopes: externalScopes,
  credential: {
    id: null,
    credentialType: 'FIDO',
    status: 'PENDING',
    challenge: {
      payload: completeConsent.credentialChallenge as string,
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

  // Tests for isConsentRequestInitiatedByValidSource
  describe('Request Validation', (): void => {
    it('Should return true', (): void => {
      expect(isConsentRequestInitiatedByValidSource(request, partialConsent))
        .toBe(true)
    })

    it('Should return false because consent is null', (): void => {
      expect(isConsentRequestInitiatedByValidSource(
        request, null as unknown as Consent))
        .toBeFalsy()
    })

    it('Should return false because initiator ID does not match', (): void => {
      expect(isConsentRequestInitiatedByValidSource(request, partialConsent2))
        .toBeFalsy()
    })

    it('Should throw an error as request headers are missing', (): void => {
      expect((): void => {
        isConsentRequestInitiatedByValidSource(
          requestNoHeaders as Request, partialConsent2)
      }).toThrowError()
    })
  })

  // Tests for updateConsentCredential
  describe('Updating Consent', (): void => {
  // eslint-disable-next-line max-len
    it('Should return a consent object with filled out credentials', async (): Promise<void> => {
      mockConsentDbUpdate.mockResolvedValueOnce(3)

      const updatedConsent = await updateConsentCredential(
        partialConsent, credential)

      expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsent)
      expect(updatedConsent).toEqual(completeConsent)
    })

    // eslint-disable-next-line max-len
    it('Should throw an error due to an error updating credentials', async (): Promise<void> => {
      mockConsentDbUpdate.mockRejectedValue(
        new Error('Error updating Database'))

      await expect(updateConsentCredential(partialConsent, credential))
        .rejects
        .toThrowError('Error updating Database')

      expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsent)
    })
  })

  // Tests for putConsentId
  describe('Requests', (): void => {
    beforeAll((): void => {
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = '1234'
      request.headers[Enum.Http.Headers.FSPIOP.DESTINATION] = '5678'
    })

    it('Should resolve successfully', async (): Promise<void> => {
      expect(await generatePutConsentsRequest(completeConsent, externalScopes))
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
