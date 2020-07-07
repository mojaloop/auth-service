// mockup sdk-standard-components library out req func

import { putConsents } from '@mojaloop/sdk-standard-components'
import { Consent } from '../model/consent'
import { Scope } from '../model/scope'
import { scopeDb } from '../lib/db'
const Enum = require('@mojaloop/central-services-shared').Enum

export async function putConsentId (consent: Consent, headers): Promise<void> {
  // Switch SOURCE and DESTINATION in headers
  const destinationId = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  headers[Enum.Http.Headers.FSPIOP.SOURCE] = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  headers[Enum.Http.Headers.FSPIOP.DESTINATION] = destinationId

  // Retrieve scopes
  let scopes: Scope = null
  scopes = await scopeDb.retrieve(consent.id)

  // Construct body of outgoing request
  const body = {
    requestId: consent.id,
    initiatorId: consent.initiatorId,
    participantId: consent.participantId,
    scopes,
    credential: {
      id: null,
      credentialType: consent.credentialType,
      credentialStatus: consent.credentialStatus,
      challenge: {
        payload: consent.credentialChallenge,
        signature: null
      },
      payload: null
    }
  }
  // Use sdk-standard-components library to send request
  putConsents(body, destinationId, consent.id, headers)
}
