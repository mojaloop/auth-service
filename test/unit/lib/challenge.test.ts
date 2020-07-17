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
import { generate } from '../../../src/lib/challenge'

describe('Challenge Generation', (): void => {
  it('Should return a 32 byte string by default', async (): Promise<void> => {
    const challenge = await generate()
    expect(Buffer.byteLength(challenge, 'base64')).toBe(32)
  })

  it('Should return a 64 byte string if argument passed', async (): Promise<void> => {
    const challenge = await generate(64)
    expect(Buffer.byteLength(challenge, 'base64')).toBe(64)
  })

  it('Should return a 64 byte string even if negative argument passed', async (): Promise<void> => {
    const challenge = await generate(-64)
    expect(Buffer.byteLength(challenge, 'base64')).toBe(64)
  })

  it('Should return a 50 byte string even if float point argument passed', async (): Promise<void> => {
    const challenge = await generate(49.88)
    expect(Buffer.byteLength(challenge, 'base64')).toBe(50)
  })

  it('Should return a 8 byte string even if negative float point argument passed', async (): Promise<void> => {
    const challenge = await generate(-8.1)
    expect(Buffer.byteLength(challenge, 'base64')).toBe(8)
  })
})
