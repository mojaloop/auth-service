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
import { Enum } from '@mojaloop/central-services-shared'
import { Consent } from '~/model/consent'
import * as validators from '~/domain/validators'
import {
  request,
  partialConsentActive,
  partialConsentActiveConflictingInitiatorId,
  requestNoHeaders
} from '../data/data'

describe('isConsentRequestInitiatedByValidSource', (): void => {
  it('Should return true', (): void => {
    expect(
      validators.isConsentRequestInitiatedByValidSource(partialConsentActive, request))
      .toBe(true)
  })

  it('Should return false because consent is null', (): void => {
    expect(validators.isConsentRequestInitiatedByValidSource(
      null as unknown as Consent, request))
      .toBeFalsy()
  })

  it('Should return false because initiator ID does not match', (): void => {
    expect(
      validators.isConsentRequestInitiatedByValidSource(partialConsentActiveConflictingInitiatorId, request))
      .toBeFalsy()
  })

  it('Should return false as source header is null', (): void => {
    request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = null as unknown as string

    expect(
      validators.isConsentRequestInitiatedByValidSource(partialConsentActive, request)
    ).toBe(false)

    // Reset header
    request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = 'pisp-2342-2233'
  })

  it('Should return false as source header is empty string', (): void => {
    request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = ''

    expect(
      validators.isConsentRequestInitiatedByValidSource(partialConsentActive, request)
    ).toBe(false)

    // Reset header
    request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = 'pisp-2342-2233'
  })

  it('Should throw an error as request headers are missing', (): void => {
    expect((): void => {
      validators.isConsentRequestInitiatedByValidSource(
        partialConsentActive, requestNoHeaders as Request)
    }).toThrowError()
  })

  it('Should return false as consent is null and request header is empty string',
    (): void => {
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = ''

      expect(
        validators.isConsentRequestInitiatedByValidSource(partialConsentActive, request)
      ).toBe(false)

      // Reset header
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = 'pisp-2342-2233'
    })

  it('Should return false as consent is null and source header is null',
    (): void => {
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = null as unknown as string

      expect(
        validators.isConsentRequestInitiatedByValidSource(partialConsentActive, request)
      ).toBe(false)

      // Reset header
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE] = 'pisp-2342-2233'
    })
})
