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
import { consentDB, retrieveScopes } from '../../../../../../src/lib/db'
import { Consent } from '../../../../../../src/model/consent'
import { thirdPartyRequest } from '../../../../../../src/lib/requests'
// eslint-disable-next-line max-len
import { updateCredential, isConsentRequestValid, putConsentId } from '../../../../../../src/server/domain/consents/{ID}/generateChallenge'
import { Enum } from '@mojaloop/central-services-shared'
import { GenericRequestResponse } from '@mojaloop/sdk-standard-components'

// Declaring Mock Functions
const mockPutConsents = jest.fn(thirdPartyRequest.putConsents)
const mockRetrieveScopes = jest.fn(retrieveScopes)
const mockConsentDbUpdate = jest.fn(consentDB.update)

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

const nullConsent: Consent = null

const challenge = 'xyhdushsoa82w92mzs='

const outputScopes = [{
  accountId: 'as2342',
  actions: ['account.getAccess', 'account.transferMoney']
},
{
  accountId: 'as22',
  actions: ['account.getAccess']
}
]

// Tests for isConsentRequestValid
describe('Request Validation', (): void => {
  it('Should return true', (): void => {
    expect(isConsentRequestValid(request, partialConsent)).toBe(true)
  })

  it('Should return false because consent is null', (): void => {
    expect(isConsentRequestValid(request, nullConsent)).toBe(false)
  })

  it('Should return false because initiator ID does not match', (): void => {
    expect(isConsentRequestValid(request, partialConsent2)).toBe(false)
  })

  it('Should throw an error as request headers are missing', (): void => {
    expect((): void => {
      isConsentRequestValid(requestNoHeaders as Request, partialConsent2)
    }).toThrowError()
  })
})

// Tests for updateCredential
describe('Updating Consent', (): void => {
  // eslint-disable-next-line max-len
  it('Should return a consent object with filled out credentials', async (): Promise<void> => {
    mockConsentDbUpdate.mockResolvedValueOnce(3)

    const updatedConsent = await updateCredential(
      partialConsent, challenge, 'FIDO', 'PENDING')

    expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsent)
    expect(updatedConsent).toEqual(completeConsent)
  })

  // eslint-disable-next-line max-len
  it('Should throw an error due to an error updating credentials', async (): Promise<void> => {
    mockConsentDbUpdate.mockRejectedValue(new Error('Error updating Database'))

    expect(async (): Promise<void> => {
      await updateCredential(partialConsent, challenge, 'FIDO', 'PENDING')
    }).toThrowError()

    expect(mockConsentDbUpdate).toHaveBeenLastCalledWith(completeConsent)
  })
})

// Tests for putConsentId
describe('Requests', (): void => {
  beforeAll((): void => {
    request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = '1234'
    request.headers[Enum.Http.Headers.FSPIOP.DESTINATION] = '5678'
    mockPutConsents.mockResolvedValue(1 as unknown as GenericRequestResponse)
    mockRetrieveScopes.mockResolvedValue(outputScopes)
  })

  // TODO: Remove one of the first 2 tests
  it('Should not throw an error', (): void => {
    expect(async (): Promise<void> => {
      await putConsentId(completeConsent, request)
    }).not.toThrowError()
  })

  it('Should return 1', async (): Promise<void> => {
    expect(await putConsentId(completeConsent, request)).toBe(1)
  })

  it('Should throw an error as request is null value', (): void => {
    expect(async (): Promise<void> => {
      await putConsentId(completeConsent, null)
    }).toThrowError()
  })

  it('Should throw an error as consent is null value', (): void => {
    expect(async (): Promise<void> => {
      await putConsentId(nullConsent, request)
    }).toThrowError()
  })

  it('Should throw an error as putConsents() throws an error', (): void => {
    mockPutConsents.mockRejectedValue(new Error('Test Error'))
    expect(async (): Promise<void> => {
      await putConsentId(completeConsent, request)
    }).toThrowError()
  })
})
