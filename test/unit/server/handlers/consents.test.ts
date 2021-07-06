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
 - Kevin Leyow <kevin.leyow@modusbox.com>
 --------------
 ******/
import { Request, ResponseToolkit } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import { h } from 'test/data/data'
import ConsentsHandler from '~/server/handlers/consents'

jest.mock('~/domain/errors')

const consentsPostRequestAUTH = {
  headers: {
    'fspiop-source': 'dfspA',
    'fspiop-destination': 'centralAuth'
  },
  params: {},
  payload: {
    consentId: '7b24ea42-6fdd-45f5-999e-0a6981c4198b',
    scopes: [
      {
        accountId: 'dfspa.username.1234',
        actions: [
          'accounts.transfer',
          'accounts.getBalance'
        ]
      }
    ],
    credential: {
      credentialType: 'FIDO',
      status: 'PENDING',
      payload: {
        id: 'credential id: identifier of pair of keys, base64 encoded, min length 59',
        rawId: 'raw credential id: identifier of pair of keys, base64 encoded, min length 59',
        response: {
          clientDataJSON: 'clientDataJSON-must-not-have-fewer-than-121-characters Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          attestationObject: 'attestationObject-must-not-have-fewer-than-306-characters Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
        },
        type: 'public-key'
      }
    }
  }
}

describe('server/handlers/consents', (): void => {
  it('Should return 202 success code', async (): Promise<void> => {
    const request = consentsPostRequestAUTH
    const response = await ConsentsHandler.post(
      null,
      request as unknown as Request,
      h as ResponseToolkit
    )

    expect(response.statusCode).toBe(Enum.Http.ReturnCodes.ACCEPTED.CODE)
  })
})
