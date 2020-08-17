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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 --------------
 ******/
import { Request } from '@hapi/hapi'
import { consentDB } from '~/lib/db'
import Logger from '@mojaloop/central-services-logger'
import SDKStandardComponents from '@mojaloop/sdk-standard-components'
import {
  generatePatchRevokedConsentRequest,
  revokeConsentStatus
} from '~/domain/consents/revoke'
import { Consent } from '~/model/consent'

const mockConsentUpdate = jest.spyOn(consentDB, 'update')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

/*
 * Mock Request Resources
 */
// @ts-ignore
const request: Request = {
  headers: {
    'fspiop-source': 'pisp-2342-2233',
    'fspiop-destination': 'dfsp-3333-2123'
  },
  params: {
    id: '1234'
  },
  payload: {
    id: '1234',
    requestId: '475234',
    initiatorId: 'pispa',
    participantId: 'sfsfdf23',
    scopes: [
      {
        accountId: '3423',
        actions: ['acc.getMoney', 'acc.sendMoney']
      },
      {
        accountId: '232345',
        actions: ['acc.accessSaving']
      }
    ],
    credential: null
  }
}

// @ts-ignore
const requestNoHeaders: Request = {
  params: {
    id: '1234'
  }
}

/*
 * Mock Consent Resources
 */
const partialConsentActive: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'ACTIVE'
}

const partialConsentActive2: Consent = {
  id: '1234',
  initiatorId: 'pi2-2233',
  participantId: 'dfs333-2123',
  status: 'ACTIVE'
}

const partialConsentRevoked: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  revokedAt: 'now',
  status: 'REVOKED'
}

const completeConsentRevoked: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  status: 'REVOKED',
  revokedAt: 'now',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

const completeConsentActive: Consent = {
  id: '1234',
  initiatorId: 'pisp-2342-2233',
  participantId: 'dfsp-3333-2123',
  credentialId: '123',
  credentialType: 'FIDO',
  status: 'ACTIVE',
  credentialStatus: 'PENDING',
  credentialChallenge: 'xyhdushsoa82w92mzs='
}

const requestBody: SDKStandardComponents.PatchConsentsRequest = {
  status: 'REVOKED',
  revokedAt: 'now'

}

describe('server/domain/consents/revoke', (): void => {
  beforeAll((): void => {
    mockConsentUpdate.mockResolvedValue(2)
    mockLoggerError.mockReturnValue(null)
    mockLoggerPush.mockReturnValue(null)
  })

  beforeEach((): void => {
    jest.clearAllMocks()
  })

  describe('revokeConsentStatus', (): void => {
    it('Should return a revoked consent', async (): Promise<void> => {
      const revokedConsent = await revokeConsentStatus(partialConsentActive)
      expect(revokedConsent.status).toBe('REVOKED')
      expect(revokedConsent.revokedAt).toBeDefined()
      expect(mockConsentUpdate).toHaveBeenCalled()
      expect(mockLoggerPush).not.toHaveBeenCalled()
    })

    it('Should also return a revoked consent', async (): Promise<void> => {
      const revokedConsent = await revokeConsentStatus(completeConsentActive)
      expect(revokedConsent.status).toBe('REVOKED')
      expect(revokedConsent.revokedAt).toBeDefined()
      expect(mockConsentUpdate).toHaveBeenCalled()
      expect(mockLoggerPush).not.toHaveBeenCalled()
    })

    it('Should return the consent without any operations, if already revoked',
      async (): Promise<void> => {
        const revokedConsent = await revokeConsentStatus(completeConsentRevoked)
        expect(revokedConsent).toStrictEqual(completeConsentRevoked)
        expect(mockLoggerPush).toHaveBeenCalled()
        expect(mockConsentUpdate).not.toHaveBeenCalled()
      })

    it('Should throw an error due to error in updating consent',
      async (): Promise<void> => {
        mockConsentUpdate.mockRejectedValue(new Error('Test Error'))

        await expect(revokeConsentStatus(partialConsentActive2))
          .rejects
          .toThrowError('Test Error')

        expect(mockConsentUpdate).toHaveBeenCalled()
        expect(mockLoggerPush).not.toHaveBeenCalled()
      })
  })

  describe('generatePatchConsentRequest', (): void => {
    it('Should return correct request body', (): void => {
      expect(generatePatchRevokedConsentRequest(completeConsentRevoked))
        .toStrictEqual(requestBody)
    })

    it('Should also return correct request body', async (): Promise<void> => {
      expect(generatePatchRevokedConsentRequest(partialConsentRevoked))
        .toStrictEqual(requestBody)
    })

    it('Should throw an error as consent is null value', (): void => {
      expect((): void => {
        generatePatchRevokedConsentRequest(
          null as unknown as Consent)
      }).toThrow()
    })
  })
})
