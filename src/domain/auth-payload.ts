import { Consent } from '../model/consent'
import { ModelScope } from '../model/scope'

/*
 * Interface for incoming payload
 * This interface is outdated
 * TODO: Switch over to `api-snippet` interfaces
 */
export interface AuthPayload {
  consentId: string;
  sourceAccountId: string;
  status: 'PENDING' | 'VERIFIED';
  challenge: string;
  value: string;
}

/*
 * Domain function to validate payload status
 */
export function isPayloadPending (payload: AuthPayload): boolean {
  return payload.status === 'PENDING'
}

/*
 * Domain function to check for existence of an active Consent key
 */
export function hasActiveCredentialForPayload (consent: Consent): boolean {
  return (consent.credentialStatus === 'ACTIVE' &&
    consent.credentialPayload !== null)
}

/*
 * Domain function to check for matching Consent scope
 */
export function hasMatchingScopeForPayload (
  consentScopes: ModelScope[],
  payload: AuthPayload): boolean {
  // Check if any scope matches
  return consentScopes.some((scope: ModelScope): boolean =>
    scope.accountId === payload.sourceAccountId
  )
}
