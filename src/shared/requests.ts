// mockup sdk-standard-components library out req func

import { putConsents } from '@mojaloop/sdk-standard-components'
import { Consent } from '../model/consent'
const Enum = require('@mojaloop/central-services-shared').Enum

export const putConsentId = async function (consent: Consent, headers): Promise<JSON> {
  // Switch SOURCE and DESTINATION in headers
  const destinationId = headers[Enum.Http.Headers.FSPIOP.SOURCE]
  headers[Enum.Http.Headers.FSPIOP.SOURCE] = headers[Enum.Http.Headers.FSPIOP.DESTINATION]
  headers[Enum.Http.Headers.FSPIOP.DESTINATION] = destinationId

  // Construct body of outgoing request
  const body = {
    requestId: consent.id,
    initiatorId: consent.initiatorId,
    participantId: consent.participantId,
    // TODO: Modify Scopes after the model is fleshed out
    scopes: [
      {
        scope: 'account.balanceInquiry',
        accountId: 'dfspa.alice.1234'
      },
      {
        scope: 'account.sendTransfer',
        accountId: 'dfspa.alice.1234'
      },
      {
        scope: 'account.sendTransfer',
        accountId: 'dfspa.alice.5678'
      }
    ],
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
  return putConsents(body, destinationId, consent.id, headers)
}
