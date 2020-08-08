/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
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

 - Ahan Gupta <ahangupta@google.com>
 --------------
 ******/
import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import put, { retrieveUpdateAndPutConsent } from '../../../../../src/server/handlers/consents/{ID}'
import * as Domain from '../../../../../src/domain/consents/consents'
import { IncorrectChallengeError, IncorrectStatusError } from '../../../../../src/domain/errors'
import { NotFoundError } from '../../../../../src/model/errors'
import * as Signature from '../../../../../src/lib/challenge'
import Logger from '@mojaloop/central-services-logger'
import { Consent } from '../../../../../src/model/consent'

const mockRetrieveValidConsent = jest.spyOn(Domain, 'retrieveValidConsent')
const mockCheckCredentialStatus = jest.spyOn(Domain, 'checkCredentialStatus')
const mockUpdateConsentCredential = jest.spyOn(Domain, 'updateConsentCredential')
const mockPutConsents = jest.spyOn(Domain, 'putConsents')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')
const mockVerifySignature = jest.spyOn(Signature, 'verifySignature')

/*
 * Mock Request Resources
 */
// @ts-ignore
const request: Request = {
  headers: {
    fspiopsource: 'pisp-2342-2233',
    fspiopdestination: 'dfsp-3333-2123'
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
    credential: {
      id: '9876',
      credentialType: 'FIDO',
      status: 'PENDING',
      challenge: {
        payload: 'string_representing_challenge_payload',
        signature: 'string_representing_challenge_signature'
      },
      payload: 'string_representing_credential_payload'
    }
  }
}

/* Mock the retrieved consent value. */
const retrievedConsent: Consent = {
  id: '1234',
  initiatorId: 'pispa',
  participantId: 'sfsfdf23',
  credentialId: '9876',
  credentialType: 'FIDO',
  credentialStatus: 'PENDING',
  credentialPayload: 'string_representing_credential_payload',
  credentialChallenge: 'string_representing_challenge_payload'
}

// @ts-ignore
const h: ResponseToolkit = {
  response: (): ResponseObject => {
    return {
      code: (num: number): ResponseObject => {
        return num as unknown as ResponseObject
      }
    } as unknown as ResponseObject
  }
}

describe('server/handler/consents/{ID}', (): void => {
  let id: string, signature: string, publicKey: string, challenge: string, requestCredentialId: string, credentialStatus: string
  beforeAll((): void => {
    mockRetrieveValidConsent.mockResolvedValue(retrievedConsent)
    mockCheckCredentialStatus.mockResolvedValue(undefined) // TODO Change.
    mockUpdateConsentCredential.mockResolvedValue(0)
    mockPutConsents.mockResolvedValue(null)
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
    mockVerifySignature.mockReturnValue(true)

    /* Setting the attributes according to the incoming request */
    // @ts-ignore
    const requestPayloadCredential = request.payload.credential
    id = request.params.id
    signature = requestPayloadCredential.challenge.signature
    publicKey = requestPayloadCredential.payload
    challenge = requestPayloadCredential.challenge.payload
    requestCredentialId = requestPayloadCredential.id
    credentialStatus = requestPayloadCredential.status
  })

  beforeEach((): void => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  it('should return a 202 success code.', async (): Promise<void> => {
    const response = await put(request as Request, h)
    expect(response.code).toBe(202)

    expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
    expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

    const credential: Domain.ConsentCredential = {
      credentialId: requestCredentialId,
      credentialStatus: 'ACTIVE',
      credentialPayload: publicKey
    }

    expect(retrieveUpdateAndPutConsent).toHaveBeenCalledWith(id, challenge,
      credentialStatus, signature,
      publicKey, requestCredentialId,
      request)
    expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
    expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, credential)
    expect(mockPutConsents).toHaveBeenCalledWith(retrievedConsent, signature, publicKey, request)
  })

  it('should return a 400 failure code, where retrieveValidConsent throws an error', async (): Promise<void> => {
    mockRetrieveValidConsent.mockRejectedValueOnce(new IncorrectChallengeError(id))

    const response = await put(request as Request, h as ResponseToolkit)
    expect(response.code).toBe(400)
    expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
    expect(mockCheckCredentialStatus).not.toHaveBeenCalled()

    expect(mockVerifySignature).not.toHaveBeenCalled()
    expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
    expect(mockPutConsents).not.toHaveBeenCalled()
  })

  it('should return a 400 failure code, where retrieveValidConsent throws an error', async (): Promise<void> => {
    mockCheckCredentialStatus.mockRejectedValueOnce(new IncorrectStatusError(id))

    const response = await put(request as Request, h as ResponseToolkit)
    expect(response).toBe(400)
    expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
    expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

    expect(mockVerifySignature).not.toHaveBeenCalled()
    expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
    expect(mockPutConsents).not.toHaveBeenCalled()
  })

  it('should throw an error when trying to retrieve the consent resource', async (): Promise<void> => {
    mockRetrieveValidConsent.mockRejectedValueOnce(new NotFoundError('Consent', id))

    expect(async (): Promise<void> => {
      await put(request as Request, h as ResponseToolkit)
    }).toThrow(new NotFoundError('Consent', id))
    expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
    expect(mockCheckCredentialStatus).not.toHaveBeenCalled()

    expect(mockVerifySignature).not.toHaveBeenCalled()
    expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
    expect(mockPutConsents).not.toHaveBeenCalled()
  })

  it('should fail to verify the signature', async (): Promise<void> => {
    mockVerifySignature.mockReturnValueOnce(false)

    const response = await put(request as Request, h as ResponseToolkit)
    expect(response).toBe(undefined) // THIS MAY BE ERRONEOUS, change if necessary.
    expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
    expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

    expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
    expect(mockUpdateConsentCredential).not.toHaveBeenCalled()
    expect(mockPutConsents).not.toHaveBeenCalled()
  })

  it('should fail to update the consent credential attributes and throw an error', async (): Promise<void> => {
    const err: NotFoundError = new NotFoundError('Consent', id)
    mockUpdateConsentCredential.mockRejectedValueOnce(err)

    expect(async (): Promise<void> => {
      await put(request as Request, h as ResponseToolkit)
    }).toThrow(err)
    expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
    expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

    /* Mock the Domain.ConsentCredential Value. */
    const credential: Domain.ConsentCredential = {
      credentialId: requestCredentialId,
      credentialStatus: 'ACTIVE',
      credentialPayload: publicKey
    }
    expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
    expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, credential)
    expect(mockPutConsents).not.toHaveBeenCalled()
  })

  it('should fail to make the outgoing call to PUT /consents/{ID} and throw an error', async (): Promise<void> => {
    const err: Error = new Error('error thrown')
    mockPutConsents.mockRejectedValueOnce(err)

    expect(async (): Promise<void> => {
      await put(request as Request, h as ResponseToolkit)
    }).toThrow(err)
    expect(mockRetrieveValidConsent).toHaveBeenCalledWith(id, challenge)
    expect(mockCheckCredentialStatus).toHaveBeenCalledWith(credentialStatus, id)

    /* Mock the Domain.ConsentCredential Value. */
    const credential: Domain.ConsentCredential = {
      credentialId: requestCredentialId,
      credentialStatus: 'ACTIVE',
      credentialPayload: publicKey
    }
    expect(mockVerifySignature).toHaveBeenCalledWith(challenge, signature, publicKey)
    expect(mockUpdateConsentCredential).toHaveBeenCalledWith(retrievedConsent, credential)
    expect(mockPutConsents).toHaveBeenCalledWith(retrievedConsent, signature, publicKey, request as Request)
  })
})
