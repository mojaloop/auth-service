/* eslint-disable max-len */
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
import { Request, ResponseObject, ResponseToolkit } from '@hapi/hapi'
import { consentDB, scopeDB } from '../../../../../../src/lib/db'
import { Consent } from '../../../../../../src/model/consent'
import { post } from '../../../../../../src/server/handlers/consents/{ID}/generateChallenge'
import * as Challenge from '../../../../../../src/lib/challenge'
import * as Domain from '../../../../../../src/domain/consents/{ID}/generateChallenge'
import * as ScopeFunctions from '../../../../../../src/lib/scopes'
import Logger from '@mojaloop/central-services-logger'
import { Scope } from '../../../../../../src/model/scope'
import { GenericRequestResponse } from '@mojaloop/sdk-standard-components'

// Declaring Mocks
const mockPutConsentId = jest.spyOn(Domain, 'putConsentId')
const mockUpdateConsentCredential = jest.spyOn(Domain, 'updateConsentCredential')
const mockGenerate = jest.spyOn(Challenge, 'generate')
const mockIsConsentRequestValid = jest.spyOn(Domain, 'isConsentRequestInitiatedByValidSource')
const mockConsentDbRetrieve = jest.spyOn(consentDB, 'retrieve')
const mockScopeDbRetrieve = jest.spyOn(scopeDB, 'retrieveAll')
const mockConvertScopesToExternal = jest.spyOn(ScopeFunctions, 'convertScopesToExternal')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

/*
 * Mock Request + Response Resources
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
const h: ResponseToolkit = {
  response: (): ResponseObject => {
    return {
      code: (num: number): ResponseObject => {
        return num as unknown as ResponseObject
      }
    } as unknown as ResponseObject
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

const challenge = 'xyhdushsoa82w92mzs='

const scopes: Scope[] = [{
  id: 123234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'account.getAccess'
},
{
  id: 232234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'account.transferMoney'
},
{
  id: 234,
  consentId: '1234',
  accountId: 'as22',
  action: 'account.getAccess'
}
]

const externalScopes = [{
  accountId: 'as2342',
  actions: ['account.getAccess', 'account.transferMoney']
},
{
  accountId: 'as22',
  actions: ['account.getAccess']
}
]

describe('server/handlers/consents/{ID}/generateChallenge', (): void => {
  beforeAll((): void => {
    mockUpdateConsentCredential.mockResolvedValue(completeConsent)
    mockGenerate.mockResolvedValue(challenge)
    mockIsConsentRequestValid.mockReturnValue(true)
    mockConsentDbRetrieve.mockResolvedValue(partialConsent)
    mockPutConsentId.mockResolvedValue(1 as unknown as GenericRequestResponse)
    mockConvertScopesToExternal.mockReturnValue(externalScopes)
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
    mockScopeDbRetrieve.mockResolvedValue(scopes)

    jest.useFakeTimers()
  })

  beforeEach((): void => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  it('Should return 202 success code', async (): Promise<void> => {
    const response = await post(
      request as Request,
      h as ResponseToolkit
    )
    expect(response).toBe(h.response().code(202))
    jest.runAllImmediates()

    expect(setImmediate).toHaveBeenCalled()
    expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
    expect(mockConsentDbRetrieve).toHaveBeenCalledWith(request.params.id)
    expect(mockGenerate).toHaveBeenCalledWith()
    expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsent, credential)
    expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
    expect(mockPutConsentId).toHaveBeenCalledWith(completeConsent, request, externalScopes)
  })

  it('Should throw an error due to consent retrieval error', async (): Promise<void> => {
    mockConsentDbRetrieve.mockRejectedValueOnce(new Error('Id does not exist in database'))
    await expect(post(request as Request, h as ResponseToolkit))
      .rejects.toThrowError('Id does not exist in database')

    expect(setImmediate).not.toHaveBeenCalled()
    expect(mockIsConsentRequestValid).not.toHaveBeenCalled()
    expect(mockConsentDbRetrieve).toHaveBeenCalledWith(request.params.id)
    expect(mockGenerate).not.toHaveBeenCalled()
    expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
    expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
    expect(mockPutConsentId).not.toHaveBeenCalled()
  })

  it('Should return 400 code due to invalid request', async (): Promise<void> => {
    mockIsConsentRequestValid.mockReturnValueOnce(false)
    const response = await post(
      request as Request,
      h as ResponseToolkit
    )
    expect(response).toBe(h.response().code(400))

    expect(mockIsConsentRequestValid).toHaveBeenCalled()
    expect(mockConsentDbRetrieve).toHaveBeenCalled()
    expect(mockGenerate).not.toHaveBeenCalled()
    expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
    expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
    expect(mockPutConsentId).not.toHaveBeenCalled()
  })

  it('Should throw an error due to error in challenge generation', async (): Promise<void> => {
    mockGenerate.mockRejectedValueOnce(new Error('Error generating challenge'))
    const response = await post(
      request as Request,
      h as ResponseToolkit
    )
    expect(response).toBe(h.response().code(202))
    jest.runAllImmediates()

    expect(setImmediate).toHaveBeenCalled()
    expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
    expect(mockConsentDbRetrieve).toHaveBeenCalledWith(request.params.id)
    expect(mockGenerate).toHaveBeenCalledWith()
    expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
    expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
    expect(mockPutConsentId).not.toHaveBeenCalled()
  })

  it('Should throw an error due to error updating credentials in database', async (): Promise<void> => {
    mockUpdateConsentCredential.mockRejectedValueOnce(new Error('Error updating db'))
    const response = await post(
      request as Request,
      h as ResponseToolkit
    )
    expect(response).toBe(h.response().code(202))
    jest.runAllImmediates()

    expect(setImmediate).toHaveBeenCalled()
    expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
    expect(mockConsentDbRetrieve).toHaveBeenCalledWith(request.params.id)
    expect(mockGenerate).toHaveBeenCalledWith()
    expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsent, credential)
    expect(mockConvertScopesToExternal).not.toHaveBeenCalled()
    expect(mockPutConsentId).not.toHaveBeenCalled()
  })

  it('Should throw an error due to error in PUT consents/{id}', async (): Promise<void> => {
    mockPutConsentId.mockRejectedValueOnce(new Error('Could not establish connection'))
    const response = await post(
      request as Request,
      h as ResponseToolkit
    )
    expect(response).toBe(h.response().code(202))
    jest.runAllImmediates()

    expect(setImmediate).toHaveBeenCalled()
    expect(mockIsConsentRequestValid).toHaveBeenCalledWith(request, partialConsent)
    expect(mockConsentDbRetrieve).toHaveBeenCalledWith(request.params.id)
    expect(mockGenerate).toHaveBeenCalledWith()
    expect(mockUpdateConsentCredential).toHaveBeenCalledWith(partialConsent, credential)
    expect(mockConvertScopesToExternal).toHaveBeenCalledWith(scopes)
    expect(mockPutConsentId).toHaveBeenCalledWith(request, completeConsent, externalScopes)
  })
})
