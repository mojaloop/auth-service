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
import { consentDB } from '../../../../../src/lib/db'
import { Consent } from '../../../../../src/model/consent'
import { thirdPartyRequest } from '../../../../../src/lib/requests'
// eslint-disable-next-line max-len
import {
  updateConsentCredential,
  isConsentRequestInitiatedByValidSource,
  putConsentId
} from '../../../../../src/domain/consents/{ID}/generateChallenge'
import { Enum } from '@mojaloop/central-services-shared'
import Logger from '@mojaloop/central-services-logger'
import { GenericRequestResponse } from '@mojaloop/sdk-standard-components'
import { ExternalScope } from '../../../../../src/lib/scopes'

// Declaring Mock Functions
const mockPutConsents = jest.spyOn(thirdPartyRequest, 'putConsents')
const mockConsentDbUpdate = jest.spyOn(consentDB, 'update')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

/*
 * Mock Request Resources
 */
// @ts-ignore
const request: Request = {
  headers: {
    fspiopsource: 'pisp-2342-2233',
    fspiopdestination: 'dfsp-3333-2123'
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
  credentialId: '123',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

const credential = {
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
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

describe('Tests for src/domain/consents/{ID}/generateChallenge', (): void => {
  beforeAll((): void => {
    mockLoggerPush.mockImplementation((): boolean => { return true })
    mockLoggerError.mockImplementation((): boolean => { return true })
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  // Tests for isConsentRequestInitiatedByValidSource
  describe('Request Validation', (): void => {
    it('Should return true', (): void => {
      expect(isConsentRequestInitiatedByValidSource(request, partialConsent)).toBe(true)
    })

    it('Should return false because consent is null', (): void => {
      expect(isConsentRequestInitiatedByValidSource(request, null as unknown as Consent)).toBe(false)
    })

    it('Should return false because initiator ID does not match', (): void => {
      expect(isConsentRequestInitiatedByValidSource(request, partialConsent2)).toBe(false)
    })

    it('Should throw an error as request headers are missing', (): void => {
      expect((): void => {
        isConsentRequestInitiatedByValidSource(requestNoHeaders as Request, partialConsent2)
      }).toThrowError()
    })
  })

  // Tests for updateConsentCredential
  describe('Updating Consent', (): void => {
  // eslint-disable-next-line max-len
    it('Should return a consent object with filled out credentials', async (): Promise<void> => {
      mockConsentDbUpdate.mockResolvedValueOnce(3)

      const updatedConsent = await updateConsentCredential(partialConsent, credential)

      expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsent)
      expect(updatedConsent).toEqual(completeConsent)
    })

    // eslint-disable-next-line max-len
    it('Should throw an error due to an error updating credentials', async (): Promise<void> => {
      mockConsentDbUpdate.mockRejectedValue(new Error('Error updating Database'))

      await expect(updateConsentCredential(partialConsent, credential)).rejects.toThrowError('Error updating Database')

      expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsent)
    })
  })

  // Tests for putConsentId
  describe('Requests', (): void => {
    beforeAll((): void => {
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = '1234'
      request.headers[Enum.Http.Headers.FSPIOP.DESTINATION] = '5678'
      mockPutConsents.mockResolvedValue(1 as unknown as GenericRequestResponse)
    })

    it('Should resolve successfully and return 1', async (): Promise<void> => {
      expect(await putConsentId(completeConsent, request, externalScopes)).toBe(1)
    })

    it('Should throw an error as request is null value', async (): Promise<void> => {
      await expect(putConsentId(completeConsent, null as unknown as Request, externalScopes)).rejects.toThrow()
    })

    it('Should throw an error as consent is null value', async (): Promise<void> => {
      await expect(putConsentId(null as unknown as Consent, request, externalScopes)).rejects.toThrow()
    })

    it('Should throw an error as putConsents() throws an error', async (): Promise<void> => {
      mockPutConsents.mockRejectedValue(new Error('Test Error'))
      await expect(putConsentId(completeConsent, request, externalScopes)).rejects.toThrowError('Test Error')
    })
  })
}
)
