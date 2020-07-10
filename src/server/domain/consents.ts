import { Request } from '@hapi/hapi'
import { consentDb, scopesDb } from '../../../../lib/db'
import { Scope } from '../../model/scope'
import { Consent } from '../../../../model/consent'
import { Logger } from '@mojaloop/central-services-logger'

// TODO: Function might not be required - Using hapi joi instead
export function isRequestValid (request: Request): boolean {
  return true

}

// TODO: Understand format scopes are sent and how they should be reformatted before registering
export async function createAndStoreConsent (request: Request): Promise<void> {
  const consent: Consent = {
    id: request.params.id,
    initiatorId: request.params.initiatorId,
    participantId: request.params.participantId
  }
  const scopesArray: Scope[] = request.params.scopes

  try {
    await consentDb.register(consent)
    await scopesDb.register(scopesArray)
  } catch (error) {
    Logger.push(error).error('Error: Unable to create/store consent and scope')
  }
}