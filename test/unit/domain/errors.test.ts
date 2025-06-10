/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import {
  IncorrectCredentialStatusError,
  IncorrectConsentStatusError,
  EmptyCredentialPayloadError,
  InvalidSignatureError,
  SignatureVerificationError,
  DatabaseError,
  PutRequestCreationError,
  PayloadNotPendingError,
  MissingScopeError,
  InactiveOrMissingCredentialError,
  ConsentError,
  putConsentError
} from '~/domain/errors'
import { v4 } from 'uuid'
import { logger } from '~/shared/logger'
import { v1_1 as fspiopAPI } from '@mojaloop/api-snippets'

// Mock the logger
jest.mock('~/shared/logger', () => ({
  logger: {
    push: jest.fn(),
    error: jest.fn()
  }
}))

// Mock the thirdPartyRequest instance from ~/domain/requests
jest.mock('~/domain/requests', () => ({
  thirdPartyRequest: {
    putConsentsError: jest.fn()
  }
}))

interface Case {
  error: ConsentError
  code: string
}
describe('errors', () => {
  const consentId: string = v4()
  const destParticipantId = 'participant-123'
  const errorInfo: ConsentError = new IncorrectCredentialStatusError(consentId)
  const errorInfoObj: fspiopAPI.Schemas.ErrorInformationObject = {
    errorInformation: {
      errorCode: errorInfo.errorCode,
      errorDescription: errorInfo.errorDescription
    }
  }
  const mockPutConsentsError = jest.requireMock('~/domain/requests').thirdPartyRequest.putConsentsError

  const cases: Case[] = [
    {
      error: new IncorrectCredentialStatusError(consentId),
      code: '6206'
    },
    {
      error: new IncorrectConsentStatusError(consentId),
      code: '6207'
    },
    {
      error: new EmptyCredentialPayloadError(consentId),
      code: '6208'
    },
    {
      error: new InvalidSignatureError(consentId),
      code: '6209'
    },
    {
      error: new SignatureVerificationError(consentId),
      code: '6210'
    },
    {
      error: new DatabaseError(consentId),
      code: '6211'
    },
    {
      error: new PutRequestCreationError(consentId),
      code: '6217'
    },
    {
      error: new PayloadNotPendingError(consentId),
      code: '6218'
    },
    {
      error: new MissingScopeError(consentId),
      code: '6129'
    },
    {
      error: new InactiveOrMissingCredentialError(consentId),
      code: '6120'
    }
  ]
  cases.forEach((c: Case) => {
    it(c.error.message, () => {
      expect(c.error.errorCode).toEqual(c.code)
    })
  })

  describe('putConsentError', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should successfully call putConsentsError when no error occurs', async () => {
      // Arrange
      mockPutConsentsError.mockResolvedValue(undefined)

      // Act
      await putConsentError(consentId, errorInfo, destParticipantId)

      // Assert
      expect(mockPutConsentsError).toHaveBeenCalledWith(consentId, errorInfoObj, destParticipantId)
      expect(logger.push).not.toHaveBeenCalled()
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should handle error and log when putConsentsError throws', async () => {
      // Arrange
      const testError = new Error('Request failed')
      mockPutConsentsError.mockRejectedValue(testError)

      // Act
      await putConsentError(consentId, errorInfo, destParticipantId)

      // Assert
      expect(mockPutConsentsError).toHaveBeenCalledWith(consentId, errorInfoObj, destParticipantId)
      expect(logger.push).toHaveBeenCalledWith({ exception: { message: testError.message } })
      expect(logger.error).toHaveBeenCalledWith('Could not make putConsentsError request')
    })

    it('should handle non-Error objects thrown by putConsentsError', async () => {
      // Arrange
      const testError = 'Non-Error failure'
      mockPutConsentsError.mockRejectedValue(testError)

      // Act
      await putConsentError(consentId, errorInfo, destParticipantId)

      // Assert
      expect(mockPutConsentsError).toHaveBeenCalledWith(consentId, errorInfoObj, destParticipantId)
      expect(logger.push).toHaveBeenCalledWith({ exception: String(testError) })
      expect(logger.error).toHaveBeenCalledWith('Could not make putConsentsError request')
    })
  })
})
