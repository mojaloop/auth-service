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

 - Raman Mangla <ramanmangla@google.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import { Request } from '@hapi/hapi'
import { Enum } from '@mojaloop/central-services-shared'
import { logger } from '~/shared/logger'
import { Consent } from '~/model/consent'
import { Scope } from '~/model/scope'
import { thirdPartyRequest } from '~/lib/requests'
import {
  AuthPayload,
  isPayloadPending,
  hasActiveCredentialForPayload,
  hasMatchingScopeForPayload
} from '~/domain/authorizations'
import { putAuthorizationErrorRequest } from '~/domain/errors'
import { TErrorInformation } from '@mojaloop/sdk-standard-components'
import { mocked } from 'ts-jest/utils'

jest.mock('~/shared/logger')

/*
 * POST /thirdpartyRequests/transactions/{ID}/authorizations
 * Domain Unit Tests
 */
describe('Incoming POST Transaction Authorization Domain', (): void => {
  describe('isPayloadPending', (): void => {
    it('returns true for \'PENDING\' payload status',
      async (): Promise<void> => {
        const pendingPayload: AuthPayload = {
          consentId: '1223abcd',
          sourceAccountId: '2222-322d-d2k2',
          status: 'PENDING',
          challenge: 'xyhdushsoa82w92mzs',
          value: 'dwuduwd&e2idjoj0w'
        }

        const correctStatus = isPayloadPending(pendingPayload)

        expect(correctStatus).toEqual(true)
      }
    )

    it('returns false for non-\'PENDING\' payload status',
      async (): Promise<void> => {
        const verifiedPayload: AuthPayload = {
          consentId: '1223abcd',
          sourceAccountId: '2222-322d-d2k2',
          status: 'VERIFIED',
          challenge: 'xyhdushsoa82w92mzs',
          value: 'dwuduwd&e2idjoj0w'
        }

        const correctStatus = isPayloadPending(verifiedPayload)

        expect(correctStatus).toEqual(false)
      }
    )
  })

  describe('hasActiveCredentialForPayload', (): void => {
    it('returns true non-null and \'ACTIVE\' consent credential',
      async (): Promise<void> => {
        const activeConsent: Consent = {
          id: '1234',
          status: 'ACTIVE',
          initiatorId: 'pisp-2342-2233',
          participantId: 'dfsp-3333-2123',
          credentialId: '123',
          credentialType: 'FIDO',
          credentialStatus: 'ACTIVE',
          credentialChallenge: 'xyhdushsoa82w92mzs',
          credentialPayload: 'dwuduwd&e2idjoj0w'
        }

        const activeKey = hasActiveCredentialForPayload(activeConsent)

        expect(activeKey).toEqual(true)
      }
    )

    it('returns false for null consent credential key',
      async (): Promise<void> => {
        const nullConsent: Consent = {
          id: '1234',
          status: 'ACTIVE',
          initiatorId: 'pisp-2342-2233',
          participantId: 'dfsp-3333-2123',
          credentialId: '123',
          credentialType: 'FIDO',
          credentialStatus: 'ACTIVE',
          credentialChallenge: 'xyhdushsoa82w92mzs',
          credentialPayload: null as unknown as string
        }

        const activeKey = hasActiveCredentialForPayload(nullConsent)

        expect(activeKey).toEqual(false)
      }
    )

    it('returns false for \'PENDING\' consent credential',
      async (): Promise<void> => {
        const pendingConsent: Consent = {
          id: '1234',
          status: 'ACTIVE',
          initiatorId: 'pisp-2342-2233',
          participantId: 'dfsp-3333-2123',
          credentialId: '123',
          credentialType: 'FIDO',
          credentialStatus: 'PENDING',
          credentialChallenge: 'xyhdushsoa82w92mzs',
          credentialPayload: null as unknown as string
        }

        const activeKey = hasActiveCredentialForPayload(pendingConsent)

        expect(activeKey).toEqual(false)
      }
    )
  })

  describe('hasMatchingScopeForPayload', (): void => {
    it('returns true if the payload scope matches an associated consent scope',
      async (): Promise<void> => {
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
      }
    )

    it('returns false if the payload scope does not match any consent scopes',
      async (): Promise<void> => {
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
      }
    )

    it('returns false if the consent scopes array is empty',
      async (): Promise<void> => {
        const payload: AuthPayload = {
          consentId: '1223abcd',
          sourceAccountId: '2222-322d-d2k2',
          status: 'PENDING',
          challenge: 'dddw7hwuehfuhnd8jd',
          value: 'dwuduwd&e2idjoj0w'
        }

        const consentScopes: Scope[] = []

        const scopeMatch = hasMatchingScopeForPayload(consentScopes, payload)

        expect(scopeMatch).toEqual(false)
      }
    )
  })

  describe('putAuthorizationErrorRequest', (): void => {
    let mockSdkErrorMethod: jest.SpyInstance
    let request: Request

    beforeAll((): void => {
      mockSdkErrorMethod = jest.spyOn(
        thirdPartyRequest,
        'putThirdpartyRequestsTransactionsAuthorizationsError'
      )

      // @ts-ignore
      request = {
        headers: {
          'fspiop-source': 'switch'
        },
        params: {
          ID: '1234'
        },
        payload: {
          consentId: '1234',
          sourceAccountId: 'pisp-2343-f223',
          status: 'PENDING',
          challenge: 'QuoteResponse Object JSON string',
          value: 'YjYyODNkOWUwZjUxNzOThmMjllYjE2Yg=='
        }
      }
    })

    it('calls the thirdPartyRequest error method with correct parameters',
      async (): Promise<void> => {
        // GenericRequestResponse
        mockSdkErrorMethod.mockResolvedValue({})

        const error: TErrorInformation = {
          errorCode: '3001',
          errorDescription: 'Bad Request'
        }

        const destParticipantId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]

        await putAuthorizationErrorRequest(request.params.ID, error, destParticipantId)

        expect(mockSdkErrorMethod).toHaveBeenCalledWith(
          {
            errorInformation: {
              errorCode: '3001',
              errorDescription: 'Bad Request'
            }
          },
          request.params.ID,
          request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
        )
      }
    )

    it('logs error in case there is an internal sdk-standard-components error',
      async (): Promise<void> => {
        const mockLoggerPush = jest.spyOn(Logger, 'push')
        const mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(
          (): void => { }
        )

        mockSdkErrorMethod.mockRejectedValue('Internal Error')
        const error: TErrorInformation = {
          errorCode: '3001',
          errorDescription: 'Bad Request'
        }

        const destParticipantId = request.headers[Enum.Http.Headers.FSPIOP.SOURCE]

        await putAuthorizationErrorRequest(request.params.ID, error, destParticipantId)

        expect(mockSdkErrorMethod).toHaveBeenCalledWith(
          {
            errorInformation: {
              errorCode: '3001',
              errorDescription: 'Bad Request'
            }
          },
          request.params.ID,
          request.headers[Enum.Http.Headers.FSPIOP.SOURCE]
        )

        expect(mocked(logger.error)).toHaveBeenCalled()
        expect(mocked(logger.push)).toHaveBeenCalled()
      }
    )
  })
})
