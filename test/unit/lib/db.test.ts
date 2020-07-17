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

import { retrieveScopes, scopeDB } from '../../../src/lib/db'

const mockScopeDBRetrieve = jest.fn(scopeDB.retrieve)

const retrievedScopes = [{
  id: '123234',
  consentId: '1234',
  accountId: 'as2342',
  actions: ['account.getAccess', 'account.transferMoney']
},
{
  id: '234',
  consentId: '1234',
  accountId: 'as22',
  actions: ['account.getAccess']
}
]

const consentId = '1234'

const outputScopes = [{
  accountId: 'as2342',
  actions: ['account.getAccess', 'account.transferMoney']
},
{
  accountId: 'as22',
  actions: ['account.getAccess']
}
]

// TODO: Add more tests
describe('Scope Retrieval/Formatting', (): void => {
  beforeAll((): void => {
    mockScopeDBRetrieve.mockResolvedValue(retrievedScopes)
  })
  it('Should return formatted scopes', async (): Promise<void> => {
    const scopes = await retrieveScopes(consentId)
    expect(scopes).toBe(outputScopes)
  })

  it('Should throw an error if error in scope retrieval',
    async (): Promise<void> => {
      expect(async (): Promise<void> => {
        await retrieveScopes(consentId)
      }).toThrowError()
    })
})
