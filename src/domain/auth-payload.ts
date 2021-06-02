import { Consent } from '../model/consent'
import { Scope } from '../model/scope'

/*
 * Interface for incoming payload
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
  consentScopes: Scope[],
  payload: AuthPayload): boolean {
  // Check if any scope matches
  return consentScopes.some((scope: Scope): boolean =>
    scope.accountId === payload.sourceAccountId
  )
}
