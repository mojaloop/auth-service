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
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 --------------
 ******/
import { Request } from '@hapi/hapi'
import { consentDB, scopeDB } from '../../../../src/lib/db'
import { createAndStoreConsent } from '../../../../src/server/domain/consents'

// Declare Mocks
const mockRegisterConsent = jest.fn(consentDB.register)
const mockRegisterScopes = jest.fn(scopeDB.register)

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
  },
  payload: {
    id: '1234',
    participantId: 'auth121',
    initiatorId: 'pispa',
    scopes: [
      {
        accountId: '3423',
        actions: ['acc.getMoney', 'acc.sendMoney']
      },
      {
        accountId: '232345',
        actions: ['acc.accessSaving']
      }
    ]
  }
}

const consent = {
  id: '1234',
  participantId: 'auth121',
  initiatorId: 'pispa'
}

// TODO: Fill out
const inputScopes = [{}]

describe('server/domain/consents', (): void => {
  beforeAll((): void => {
    mockRegisterConsent.mockResolvedValue(null)
    mockRegisterScopes.mockResolvedValue(null)
  })
  it('Should return nothing and no errors thrown', async (): Promise<void> => {
    expect(async (): Promise<void> => {
      await createAndStoreConsent(request)
    }).not.toThrowError()

    expect(mockRegisterConsent).toHaveBeenCalledWith(consent)
    expect(mockRegisterScopes).toHaveBeenCalledWith(inputScopes)
  })

  it('Should throw an error due to error in registering Consent', async (): Promise<void> => {
    mockRegisterConsent.mockRejectedValueOnce(new Error('Unable to Register Consent'))
    expect(async (): Promise<void> => {
      await createAndStoreConsent(request)
    }).toThrowError()

    expect(mockRegisterConsent).toHaveBeenCalledWith(consent)
    expect(mockRegisterScopes).not.toHaveBeenCalled()
  })

  it('Should throw an error due to error in registering Scopes', async (): Promise<void> => {
    mockRegisterScopes.mockRejectedValueOnce(new Error('Unable to Register Scopes'))
    expect(async (): Promise<void> => {
      await createAndStoreConsent(request)
    }).toThrowError()

    expect(mockRegisterConsent).toHaveBeenCalledWith(consent)
    expect(mockRegisterScopes).toHaveBeenCalledWith(inputScopes)
  })
})
