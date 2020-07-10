/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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
import { scopeDb } from '../../../../lib/db'
import { Consent } from '../../../../model/consent'
import { putConsentId } from '../../../src/shared/requests'
import { putConsents } from '@mojaloop/sdk-standard-components'
const Enum = require('@mojaloop/central-services-shared').Enum

/*
 * Mock Consent Resources
 */
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

// Mock Header
const headers = {}
headers[Enum.Http.Headers.FSPIOP.SOURCE] = '1234'
headers[Enum.Http.Headers.FSPIOP.DESTINATION] = '5678'

// Declaring Mock Functions
const mockPutConsents = putConsents as jest.Mock
const mockScopeDbRetrieve = scopeDb.retrieve as jest.Mock

describe('server/handlers/consents/{ID}/generateChallenge', (): void => {
  beforeAll((): void => {
    mockPutConsents.mockResolvedValue(1)
    mockScopeDbRetrieve.mockResolvedValue({ data: null })
  })

  // TODO: Remove one of the first 2 tests
  it('Should not throw an error', (): void => {
    expect(async (): Promise<void> => {
      await putConsentId(completeConsent, headers)
    }).not.toThrowError()
  })

  it('Should return 1', async (): Promise<void> => {
    expect(await putConsentId(completeConsent, headers)).toBe(1)
  })

  it('Should throw an error as header is null value', (): void => {
    expect(async (): Promise<void> => {
      await putConsentId(completeConsent, null)
    }).toThrowError()
  })

  it('Should throw an error as consent is null value', (): void => {
    expect(async (): Promise<void> => {
      await putConsentId(nullConsent, headers)
    }).toThrowError()
  })

  it('Should throw an error as putConsents() throws an error', (): void => {
    mockPutConsents.mockRejectedValue(new Error('Test Error'))
    expect(async (): Promise<void> => {
      await putConsentId(completeConsent, headers)
    }).toThrowError()
  })
})
