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

import { logger } from '~/shared/logger'
import { TErrorInformation, TErrorInformationObject } from '@mojaloop/sdk-standard-components'
import { thirdPartyRequest } from '../lib/requests'

// Type guard for Mojaloop errors
export function isMojaloopError (error: unknown): error is TErrorInformation {
  const mojaloopError = (error as TErrorInformation)
  return !!(mojaloopError.errorCode && mojaloopError.errorDescription)
}

/*
 * Domain function make an error request using Mojaloop internal codes
 */
export async function putAuthorizationErrorRequest (
  consentId: string,
  error: TErrorInformation,
  destParticipantId: string): Promise<void> {
  const errorInfoObj: TErrorInformationObject = {
    errorInformation: {
      errorCode: error.errorCode,
      errorDescription: error.errorDescription
    }
  }

  try {
    await
    thirdPartyRequest.putThirdpartyRequestsTransactionsAuthorizationsError(
      errorInfoObj,
      consentId,
      destParticipantId
    )
  } catch (error) {
    logger.push({ error }).error('Could not make putThirdpartyRequestsTransactionsAuthorizationsError request')
  }
}

/*
 * Domain function make an error request using Mojaloop internal codes
 */
export async function putConsentError (
  consentId: string,
  error: TErrorInformation,
  destParticipantId: string): Promise<void> {
  const errorInfoObj: TErrorInformationObject = {
    errorInformation: {
      errorCode: error.errorCode,
      errorDescription: error.errorDescription
    }
  }

  try {
    await
    thirdPartyRequest.putConsentsError(
      consentId,
      errorInfoObj,
      destParticipantId
    )
  } catch (error) {
    logger.push({ error }).error('Could not make putConsentsError request')
  }
}

// TODO: Replace all codes with agreed on codes
export class ChallengeMismatchError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6205'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Challenge in payload different from challenge in consent ${consentId}$`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class MojaloopError extends Error implements TErrorInformation {
  public readonly errorCode: string = '6206'
  public readonly errorDescription: string

  public constructor (errorCode: string, errorDescription: string) {
    super(errorDescription)
    this.errorDescription = errorDescription
    this.errorCode = errorCode
  }
}

export class ConsentError extends MojaloopError {
  public consentId: string
  public constructor (errorCode: string, errorDescription: string, consentId: string) {
    super(errorCode, errorDescription)
    this.consentId = consentId
  }
}

export class IncorrectCredentialStatusError extends ConsentError {
  public constructor (consentId: string) {
    super('6206', `Incorrect Credential status ${consentId}`, consentId)
  }
}

export class IncorrectConsentStatusError extends ConsentError {
  public constructor (consentId: string) {
    super('6207', `Incorrect Consent status ${consentId}`, consentId)
  }
}

export class EmptyCredentialPayloadError extends ConsentError {
  public constructor (consentId: string) {
    super('6208', `Credential Payload not provided for ${consentId}`, consentId)
  }
}

export class InvalidSignatureError extends ConsentError {
  public constructor (consentId: string) {
    super('6209', `Signature provided was invalid for consent: ${consentId}`, consentId)
  }
}

export class SignatureVerificationError extends ConsentError {
  public constructor (consentId: string) {
    super('6210', `Signature verification ran into errors for ${consentId}`, consentId)
  }
}

export class DatabaseError extends ConsentError {
  public constructor (consentId: string) {
    super('6211', `Auth service database error for ${consentId}`, consentId)
  }
}

export class PutRequestCreationError extends ConsentError {
  public constructor (consentId: string) {
    super('6217', `Error creating outgoing put request for ${consentId}`, consentId)
  }
}

export class PayloadNotPendingError extends ConsentError {
  public constructor (consentId: string) {
    super('6218', `Incoming payload for ${consentId} transaction not pending`, consentId)
  }
}

export class MissingScopeError extends ConsentError {
  public constructor (consentId: string) {
    super('6129', `Missing scope for ${consentId}`, consentId)
  }
}

export class InactiveOrMissingCredentialError extends ConsentError {
  public constructor (consentId: string) {
    super('6120', `The credential for ${consentId} is either inactive or missing`, consentId)
  }
}
