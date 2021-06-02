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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/
import { Db, consentDB, scopeDB } from '~/model/db'
import { createAndStoreConsent } from '~/domain/consents'

import * as ScopeFunction from '~/domain/scopes'
import {
  requestWithPayloadScopes, externalScopes,
  partialConsentActive, scopes
} from '~/../test/data/data'
import { DatabaseError } from '~/domain/errors'
import { logger } from '~/shared/logger'
// import { mocked } from 'ts-jest/utils'

// jest.mock('~/shared/logger')

// Declare Mocks
const mockInsertConsent = jest.spyOn(consentDB, 'insert')
const mockInsertScopes = jest.spyOn(scopeDB, 'insert')
const mockConvertExternalToScope = jest.spyOn(
  ScopeFunction, 'convertExternalToScope')

describe('server/domain/consents', (): void => {
  const consentId = requestWithPayloadScopes.params.ID
  const initiatorId = requestWithPayloadScopes.headers['fspiop-source']
  const participantId = requestWithPayloadScopes.headers['fspiop-destination']
  const scopesExternal: ScopeFunction.ExternalScope[] = (requestWithPayloadScopes.payload as Record<string, unknown>).scopes as unknown as ScopeFunction.ExternalScope[]
  beforeAll(async (): Promise<void> => {
    await Db.migrate.latest()
    await Db.raw('PRAGMA foreign_keys = ON')
    mockConvertExternalToScope.mockReturnValue(scopes)
  })

  afterAll(async (): Promise<void> => {
    Db.destroy()
  })

  beforeEach(async (): Promise<void> => {
    jest.clearAllMocks()
    mockInsertConsent.mockResolvedValue(true)
    mockInsertScopes.mockResolvedValue(true)
    await Db('Consent').del()
    await Db('Scope').del()
  })

  it('test logger', (): void => {
    expect(logger).toBeDefined()
    expect(logger.push({})).toBeDefined()
  })
  it('Should resolve successfully', async (): Promise<void> => {
    await expect(createAndStoreConsent(consentId, initiatorId, participantId, scopesExternal))
      .resolves
      .toBe(undefined)

    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, 'b51ec534-ee48-4575-b6a9-ead2955b8069')
    expect(mockInsertConsent).toHaveBeenCalledWith(partialConsentActive, expect.anything())
    expect(mockInsertScopes).toHaveBeenCalledWith(scopes, expect.anything())
  })

  it('Should propagate error in inserting Consent in database', async (): Promise<void> => {
    const testError = new Error('Unable to Register Consent')
    mockInsertConsent.mockRejectedValueOnce(testError)
    await expect(createAndStoreConsent(consentId, initiatorId, participantId, scopesExternal))
      .rejects
      .toThrowError(new DatabaseError(consentId))
    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, 'b51ec534-ee48-4575-b6a9-ead2955b8069')
    expect(mockInsertConsent).toHaveBeenCalledWith(partialConsentActive, expect.anything())
    expect(mockInsertScopes).not.toHaveBeenCalled()
    // expect(mocked(logger.push)).toHaveBeenCalledWith({ error: testError })
    mockInsertConsent.mockClear()
  })

  it('Should propagate error in inserting Scopes in database', async (): Promise<void> => {
    const testError = new Error('Unable to Register Scopes')
    mockInsertScopes.mockRejectedValueOnce(testError)
    await expect(createAndStoreConsent(consentId, initiatorId, participantId, scopesExternal))
      .rejects
      .toThrowError(new DatabaseError(consentId))
    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, 'b51ec534-ee48-4575-b6a9-ead2955b8069')
    expect(mockInsertConsent).toHaveBeenCalledWith(partialConsentActive, expect.anything())
    expect(mockInsertScopes).toHaveBeenCalledWith(scopes, expect.anything())
    // expect(mocked(logger.push)).toHaveBeenCalledWith({ error: testError })
    mockInsertScopes.mockClear()
  })
})
