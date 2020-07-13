import { Request } from '@hapi/hapi'
import { consentDb, scopesDb } from '../../../../lib/db'
import { Scope } from '../../model/scope'
import { Consent } from '../../../../model/consent'
import { Logger } from '@mojaloop/central-services-logger'

// TODO: Understand format scopes are sent and how they should be reformatted before registering
export async function createAndStoreConsent (request: Request): Promise<void> {
  const payload = request.payload

  const consent: Consent = {
    id: request.params.id,
    initiatorId: request.params.initiatorId,
    participantId: request.params.participantId
  }

  const scopesArray: Scope[] = []

  payload.scopes.forEach((element: object): void => {
    const accountId = element.accountId
    element.actions.forEach((action: object): void => {
      const scope = {
        accountId,
        action
      }
      scopesArray.push(scope)
    })
  })

  try {
    await consentDb.register(consent)
    await scopesDb.register(scopesArray)
  } catch (error) {
    Logger.push(error).error('Error: Unable to create/store consent and scope')
  }
}
