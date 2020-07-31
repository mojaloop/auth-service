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
import { Request } from '@hapi/hapi'
import { consentDB, scopeDB } from '../../../src/lib/db'
import { createAndStoreConsent } from '../../../src/domain/consents'
import Logger from '@mojaloop/central-services-logger'

import * as ScopeFunction from '../../../src/lib/scopes'

// Declare Mocks
const mockInsertConsent = jest.spyOn(consentDB, 'insert')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')
const mockInsertScopes = jest.spyOn(scopeDB, 'insert')
const mockConvertExternalToScope = jest.spyOn(
  ScopeFunction, 'convertExternalToScope')

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
    scopes: [{
      accountId: 'as2342',
      actions: ['account.getAccess', 'account.transferMoney']
    },
    {
      accountId: 'as22',
      actions: ['account.getAccess']
    }
    ]
  }
}

const consent = {
  id: '1234',
  participantId: 'auth121',
  initiatorId: 'pispa'
}

const externalScopes = [{
  accountId: 'as2342',
  actions: ['account.getAccess', 'account.transferMoney']
},
{
  accountId: 'as22',
  actions: ['account.getAccess']
}
]

const scopes = [{
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

  it('Should return nothing and no errors thrown', async (): Promise<void> => {
    await expect(createAndStoreConsent(request)).resolves.toBe(undefined)

    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, '1234')
    expect(mockInsertConsent).toHaveBeenCalledWith(consent)
    expect(mockInsertScopes).toHaveBeenCalledWith(scopes)
  })

  it('Should throw an error due to error in registering Consent', async (): Promise<void> => {
    mockInsertConsent.mockRejectedValueOnce(new Error('Unable to Register Consent'))
    await expect(createAndStoreConsent(request)).rejects.toThrowError('Unable to Register Consent')

    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, '1234')
    expect(mockInsertConsent).toHaveBeenCalledWith(consent)
    expect(mockInsertScopes).not.toHaveBeenCalled()
  })

  it('Should throw an error due to error in registering Scopes', async (): Promise<void> => {
    mockInsertScopes.mockRejectedValueOnce(new Error('Unable to Register Scopes'))
    await expect(createAndStoreConsent(request)).rejects.toThrowError('Unable to Register Scopes')

    expect(mockConvertExternalToScope).toHaveBeenCalledWith(externalScopes, '1234')
    expect(mockInsertConsent).toHaveBeenCalledWith(consent)
    expect(mockInsertScopes).toHaveBeenCalledWith(scopes)
  })
})
