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

import { Scope } from '~/model/scope/scope'
import * as ScopeFunctions from '~/domain/scopes'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets';

const consentId = '1234'

const scopes: Scope[] = [{
  id: 123234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'accounts.getBalance'
},
{
  id: 232234,
  consentId: '1234',
  accountId: 'as2342',
  action: 'accounts.transfer'
},
{
  id: 234,
  consentId: '1234',
  accountId: 'as22',
  action: 'accounts.getBalance'
}
]

const scopesNoId: Scope[] = [{
  consentId: '1234',
  accountId: 'as2342',
  action: 'accounts.getBalance'
},
{
  consentId: '1234',
  accountId: 'as2342',
  action: 'accounts.transfer'
},
{
  consentId: '1234',
  accountId: 'as22',
  action: 'accounts.getBalance'
}
]

const externalScope: tpAPI.Schemas.Scope[] = [{
  accountId: 'as2342',
  actions: ['accounts.getBalance', 'accounts.transfer']
},
{
  accountId: 'as22',
  actions: ['accounts.getBalance']
}
]

describe('Scope Convert Scopes to ExternalScopes', (): void => {
  it('Should return Scope array when input ExternalScope array', (): void => {
    expect(ScopeFunctions.convertDatabaseScopesToThirdpartyScopes(scopes))
      .toStrictEqual(externalScope)
  })
})

describe('Scope Convert ExternalScope to Scope', (): void => {
  it('Should return Scope array when input ExternalScope array',
    (): void => {
      expect(ScopeFunctions.convertThirdpartyScopesToDatabaseScope(externalScope, consentId))
        .toStrictEqual(scopesNoId)
    }
  )
})
