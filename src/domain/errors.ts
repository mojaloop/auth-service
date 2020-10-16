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
    logger.push({error}).error('Could not make putThirdpartyRequestsTransactionsAuthorizationsError request')
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
    logger.push({error}).error('Could not make putConsentsError request')
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

export class IncorrectCredentialStatusError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6206'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Incorrect Credential status ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class IncorrectConsentStatusError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6207'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Incorrect Consent status ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class EmptyCredentialPayloadError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6208'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Credential Payload not provided for ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class InvalidSignatureError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6209'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Signature provided was invalid for consent: ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class SignatureVerificationError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6210'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Signature verification ran into errors for ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class DatabaseError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6211'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Auth service database error for ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class InvalidInitiatorSourceError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6212'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Consent request initiated by an invalid source for ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class InvalidConsentStatusError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6213'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Consent status is invalid for ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class RevokedConsentStatusError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6214'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Consent ${consentId} has been revoked`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class ChallengeGenerationError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6215'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Error generating challenge for ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class ActiveConsentChallengeRequestError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6216'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Active consent ${consentId} has requested for a challenge`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class PutRequestCreationError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6217'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Error creating outgoing put request for ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class PayloadNotPendingError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6218'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Incoming payload for ${consentId} transaction not pending`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class MissingScopeError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6219'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`Missing scope for ${consentId}`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}

export class InactiveOrMissingCredentialError extends Error implements TErrorInformation {
  public consentId: string
  public readonly errorCode: string = '6220'
  public readonly errorDescription: string

  public constructor (consentId: string) {
    super(`The credential for ${consentId} is either inactive or missing`)
    this.errorDescription = this.message
    this.consentId = consentId
  }
}
