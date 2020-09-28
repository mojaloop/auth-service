/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the 'License') and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
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

 - Ahan Gupta <ahangupta.96@gmail.com>
 - Kenneth Zeng <kkzeng@google.com>
 --------------
 ******/

import Logger from '@mojaloop/central-services-logger'
import { TErrorInformation, TErrorInformationObject } from '@mojaloop/sdk-standard-components'
import { thirdPartyRequest } from '../lib/requests'
import { Request } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'

// TODO: Replace all codes with agreed on codes

/*
 * Domain function make an error request using Mojaloop internal codes
 */
export async function putConsentError (
  request: Request,
  error: TErrorInformation): Promise<void> {
  const errorInfoObj: TErrorInformationObject = {
    errorInformation: {
      errorCode: error.errorCode,
      errorDescription: error.errorDescription
    }
  }

  try {
    await
    thirdPartyRequest.putConsentsError(
      request.params.id,
      errorInfoObj,
      request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
    )
  } catch (error) {
    Logger.push(error)
    Logger.error('Could not make PUT error request')
  }
}

export class IncorrectChallengeError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '3150'
  public readonly errorDescription: string = 'Incorrect Challenge'

  public constructor (consentId: string) {
    super(`Incorrect Challenge ${consentId}$`)
    this.consentId = consentId
  }
}

export class IncorrectCredentialStatusError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '3151'
  public readonly errorDescription: string = 'Incorrect Credential status'

  public constructor (consentId: string) {
    super(`Incorrect Credential status ${consentId}`)
    this.consentId = consentId
  }
}

export class IncorrectConsentStatusError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '3152'
  public readonly errorDescription: string = 'Incorrect Consent status'

  public constructor (consentId: string) {
    super(`Incorrect Consent status ${consentId}`)
    this.consentId = consentId
  }
}

export class EmptyCredentialPayloadError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '3153'
  public readonly errorDescription: string = 'Credential Payload not provided'

  public constructor (consentId: string) {
    super(`Credential Payload not provided for ${consentId}`)
    this.consentId = consentId
  }
}
