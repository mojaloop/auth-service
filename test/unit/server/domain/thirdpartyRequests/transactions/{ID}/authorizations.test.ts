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

 - Raman Mangla <ramanmangla@google.com>
 --------------
 ******/

import { Consent } from '../../../../../../../src/model/consent'
import { Scope } from '../../../../../../../src/model/scope'
import {
  AuthPayload,
  isValidatedPayload,
  isPendingPayload,
  hasActiveConsentKey,
  hasMatchingScopeForPayload
} from '../../../../../../../src/server/domain/thirdpartyRequests/transactions/{ID}/authorizations'

/*
 * POST /thirdpartyRequests/transactions/{ID}/authorizations
 * Domain Unit Tests
 */
describe('Incoming POST Transaction Authorization Domain', (): void => {
  describe('isValidatedPayload', (): void => {
    it('returns true when all payload fields exist with non-NULL values', async (): Promise<void> => {
      const payloadWithoutNulls: AuthPayload = {
        consentId: '1223abcd',
        sourceAccountId: '2222-322d-d2k2',
        status: 'PENDING',
        challenge: 'xyhdushsoa82w92mzs',
        value: 'dwuduwd&e2idjoj0w'
      }

      const hasNulls = isValidatedPayload(payloadWithoutNulls)

      expect(hasNulls).toEqual(false)
    })

    it('returns false for null fields in the payload', async (): Promise<void> => {
      const payloadWithNulls: AuthPayload = {
        consentId: '1223abcd',
        sourceAccountId: '2222-322d-d2k2',
        status: null as unknown as string,
        challenge: null as unknown as string,
        value: 'dwuduwd&e2idjoj0w'
      }

      const hasNulls = isValidatedPayload(payloadWithNulls)

      expect(hasNulls).toEqual(true)
    })

    it('returns false for payload with missing fields', async (): Promise<void> => {
      const payloadWithoutFields = {
        consentId: '1223abcd',
        sourceAccountId: '2222-322d-d2k2',
        status: 'PENDING'
      }

      const isValidated = isValidatedPayload(payloadWithoutFields as AuthPayload)

      expect(isValidated).toEqual(false)
    })
  })

  describe('isPendingPayload', (): void => {
    it('returns true for \'PENDING\' payload status', async (): Promise<void> => {
      const pendingPayload: AuthPayload = {
        consentId: '1223abcd',
        sourceAccountId: '2222-322d-d2k2',
        status: 'PENDING',
        challenge: 'xyhdushsoa82w92mzs',
        value: 'dwuduwd&e2idjoj0w'
      }

      const correctStatus = isPendingPayload(pendingPayload)

      expect(correctStatus).toEqual(true)
    })

    it('returns false for non-\'PENDING\' payload status', async (): Promise<void> => {
      const verifiedPayload: AuthPayload = {
        consentId: '1223abcd',
        sourceAccountId: '2222-322d-d2k2',
        status: 'VERIFIED',
        challenge: 'xyhdushsoa82w92mzs',
        value: 'dwuduwd&e2idjoj0w'
      }

      const correctStatus = isPendingPayload(verifiedPayload)

      expect(correctStatus).toEqual(false)
    })
  })

  describe('hasActiveConsentKey', (): void => {
    it('returns true non-NULL and \'ACTIVE\' consent credential', async (): Promise<void> => {
      const activeConsent: Consent = {
        id: '1234',
        initiatorId: 'pisp-2342-2233',
        participantId: 'dfsp-3333-2123',
        credentialId: '123',
        credentialType: 'FIDO',
        credentialStatus: 'ACTIVE',
        credentialChallenge: 'xyhdushsoa82w92mzs',
        credentialPayload: 'dwuduwd&e2idjoj0w'
      }

      const activeKey = hasActiveConsentKey(activeConsent)

      expect(activeKey).toEqual(true)
    })

    it('returns false for NULL consent credential key', async (): Promise<void> => {
      const nullConsent: Consent = {
        id: '1234',
        initiatorId: 'pisp-2342-2233',
        participantId: 'dfsp-3333-2123',
        credentialId: '123',
        credentialType: 'FIDO',
        credentialStatus: 'ACTIVE',
        credentialChallenge: 'xyhdushsoa82w92mzs',
        credentialPayload: null as unknown as string
      }

      const activeKey = hasActiveConsentKey(nullConsent)

      expect(activeKey).toEqual(false)
    })

    it('returns false for \'PENDING\' consent credential', async (): Promise<void> => {
      const pendingConsent: Consent = {
        id: '1234',
        initiatorId: 'pisp-2342-2233',
        participantId: 'dfsp-3333-2123',
        credentialId: '123',
        credentialType: 'FIDO',
        credentialStatus: 'PENDING',
        credentialChallenge: 'xyhdushsoa82w92mzs',
        credentialPayload: null as unknown as string
      }

      const activeKey = hasActiveConsentKey(pendingConsent)

      expect(activeKey).toEqual(false)
    })
  })

  describe('  hasMatchingScopeForPayload', (): void => {
    it('returns true if the payload scope matches an associated consent scope', async (): Promise<void> => {
      const payload: AuthPayload = {
        consentId: '1223abcd',
        sourceAccountId: '2222-322d-d2k2',
        status: 'PENDING',
        challenge: 'dddw7hwuehfuhnd8jd',
        value: 'dwuduwd&e2idjoj0w'
      }

      const consentScopes: Scope[] = [
        {
          id: 1,
          consentId: payload.consentId,
          action: 'account.transfer',
          accountId: '3332-edds-2332'
        },
        {
          id: 2,
          consentId: payload.consentId,
          action: 'account.balance',
          accountId: payload.sourceAccountId
        },
        {
          id: 3,
          consentId: payload.consentId,
          action: 'account.billpayment',
          accountId: '2020-20sj-nsj2'
        }
      ]

      const scopeMatch = hasMatchingScopeForPayload(consentScopes, payload)

      expect(scopeMatch).toEqual(true)
    })

    it('returns false if the payload scope does not match any consent scopes', async (): Promise<void> => {
      const payload: AuthPayload = {
        consentId: '1223abcd',
        sourceAccountId: '2222-322d-d2k2',
        status: 'PENDING',
        challenge: 'dddw7hwuehfuhnd8jd',
        value: 'dwuduwd&e2idjoj0w'
      }

      const consentScopes: Scope[] = [
        {
          id: 1,
          consentId: payload.consentId,
          action: 'account.transfer',
          accountId: '3332-edds-2332'
        },
        {
          id: 2,
          consentId: payload.consentId,
          action: 'account.balance',
          accountId: '3332-2dcx-1020'
        },
        {
          id: 3,
          consentId: payload.consentId,
          action: 'account.billpayment',
          accountId: '2020-20sj-nsj2'
        }
      ]

      const scopeMatch = hasMatchingScopeForPayload(consentScopes, payload)

      expect(scopeMatch).toEqual(false)
    })
  })
})
