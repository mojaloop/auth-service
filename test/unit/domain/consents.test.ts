/* eslint-disable max-len */
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
import { consentDB, scopeDB } from '~/lib/db'
import { createAndStoreConsent } from '~/domain/consents'
import Logger from '@mojaloop/central-services-logger'

import * as ScopeFunction from '~/lib/scopes'
import {
  requestWithPayloadScopes, externalScopes,
  partialConsentActive, scopes
} from '~/../test/data/data'
import { DatabaseError } from '~/domain/errors'

// Declare Mocks
const mockInsertConsent = jest.spyOn(consentDB, 'insert')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')
const mockInsertScopes = jest.spyOn(scopeDB, 'insert')
const mockConvertExternalToScope = jest.spyOn(
  ScopeFunction, 'convertExternalToScope')

describe('server/domain/consents', (): void => {
  beforeAll((): void => {
    mockInsertConsent.mockResolvedValue(true)
    mockInsertScopes.mockResolvedValue(true)
    mockConvertExternalToScope.mockReturnValue(scopes)
    mockLoggerError.mockReturnValue(null)
    mockLoggerPush.mockReturnValue(null)
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  it('Should resolve successfully', async (): Promise<void> => {
    await expect(createAndStoreConsent(requestWithPayloadScopes))
      .resolves
      .toBe(undefined)

    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, '1234')
    expect(mockInsertConsent).toHaveBeenCalledWith(partialConsentActive)
    expect(mockInsertScopes).toHaveBeenCalledWith(scopes)
  })

  it('Should propagate error in inserting Consent in database', async (): Promise<void> => {
    const testError = new Error('Unable to Register Consent')
    mockInsertConsent.mockRejectedValueOnce(testError)
    await expect(createAndStoreConsent(requestWithPayloadScopes))
      .rejects
      .toThrowError(new DatabaseError(requestWithPayloadScopes.params.ID))

    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, '1234')
    expect(mockInsertConsent).toHaveBeenCalledWith(partialConsentActive)
    expect(mockInsertScopes).not.toHaveBeenCalled()
    expect(mockLoggerPush).toHaveBeenCalledWith(testError)
  })

  it('Should propagate error in inserting Scopes in database', async (): Promise<void> => {
    const testError = new Error('Unable to Register Scopes')
    mockInsertScopes.mockRejectedValueOnce(testError)
    await expect(createAndStoreConsent(requestWithPayloadScopes))
      .rejects
      .toThrowError(new DatabaseError(requestWithPayloadScopes.params.ID))

    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, '1234')
    expect(mockInsertConsent).toHaveBeenCalledWith(partialConsentActive)
    expect(mockInsertScopes).toHaveBeenCalledWith(scopes)
    expect(mockLoggerPush).toHaveBeenCalledWith(testError)
  })
})
