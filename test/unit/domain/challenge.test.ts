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

 - Abhimanyu Kapur <abhi.kapur09@gmail.com>
 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import crypto from 'crypto'
import Credential from './credential'
import { deriveChallenge, verifySignature } from '~/domain/challenge'
import { canonicalize } from 'json-canonicalize'
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'

/*
 * Signature Verification Unit Tests
 *
 * Currently, the tests focus on RSA 2048 and ECDSA:secp256k1 keys.
 * Support for additional keys can be extended further.
 */
describe('challenge', (): void => {
  describe('deriveChallenge', () => {
    it('canonicalizes a consent the same as the flutter library', () => {
      // Arrange
      const rawChallenge = {
        consentId: 'd194d840-97e5-44e7-84cc-bc54a51a7771',
        scopes: [
          {
            address: 'ba32b791-27af-4fe5-987f-f1a055031389',
            actions: ['ACCOUNTS_GET_BALANCE', 'ACCOUNTS_TRANSFER']
          },
          {
            address: '232b396c-edba-4d10-b83e-b2d8e938d0e9',
            actions: ['ACCOUNTS_GET_BALANCE']
          }
        ]
      }
      const expected = '{"consentId":"d194d840-97e5-44e7-84cc-bc54a51a7771","scopes":[{"actions":["ACCOUNTS_GET_BALANCE","ACCOUNTS_TRANSFER"],"address":"ba32b791-27af-4fe5-987f-f1a055031389"},{"actions":["ACCOUNTS_GET_BALANCE"],"address":"232b396c-edba-4d10-b83e-b2d8e938d0e9"}]}'

      // Act
      const canonicalString = canonicalize(rawChallenge)

      // Assert
      console.log('canonicalString is', canonicalString)
      expect(canonicalString).toStrictEqual(expected)
    })

    it('parses the same hash', () => {
      // Arrange
      const consent = { consentId: '11a91835-cdda-418b-9c0a-e8de62fbc84c', scopes: [{ address: 'a84cd5b8-5883-4deb-9dec-2e86a9603922', actions: ['ACCOUNTS_GET_BALANCE', 'ACCOUNTS_TRANSFER'] }, { address: 'b7b40dd7-ae6b-4904-9654-82d02544b327', actions: ['ACCOUNTS_GET_BALANCE'] }] }
      const expected = 'YzhmYzM5NDFkNjA3MGQzYmMzZmIzYTk5ZjgyZWVkMWUwNjdhOWQ2ZDU2YzcxYzI0ODUxZWM4YTc2NDljN2RhMA=='

      // Act
      const result = deriveChallenge(consent as unknown as tpAPI.Schemas.ConsentsPostRequestAUTH)

      // Assert
      console.log('result is', result)
      expect(result).toStrictEqual(expected)
    })

    it('parses the same hash for a different consent', () => {
      // Arrange
      const consent = { consentId: '46876aac-5db8-4353-bb3c-a6a905843ce7', consentRequestId: 'c51ec534-ee48-4575-b6a9-ead2955b8069', scopes: [{ address: 'dfspa.username.5678', actions: ['ACCOUNTS_TRANSFER'] }] }
      const expected = 'ODNkN2RkMzlkMTA5NGFmZDUzNWU1N2I5ODk5ZmNlM2JlODJlMGFkNDk3M2I1MmE1MzcxZmQ3ZGYzZmEyNjY5MQ=='

      // Act
      const result = deriveChallenge(consent as unknown as tpAPI.Schemas.ConsentsPostRequestAUTH)

      // Assert
      console.log('result is', result)
      expect(result).toStrictEqual(expected)
    })
  })

  describe('verifySignature', () => {
    // Each test generates a random key pair
    let challenge: string
    let signer: crypto.Signer

    beforeEach((): void => {
      challenge = 'Crypto Auth service Yay!'
      // Digest Algorithm
      signer = crypto.createSign('SHA256')

      // Hash challenge using SHA256
      signer.update(challenge)
    })

    it('verifies correct signature - EC Key (secp256k1)', (): void => {
      const keyPair = crypto.generateKeyPairSync('ec', {
        namedCurve: 'secp256k1', // Allowed by FIDO spec
        publicKeyEncoding: {
          type: 'spki', // Key infrasructure
          format: 'pem' // Encoding format
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      })

      const signature = signer.sign(keyPair.privateKey, 'base64')
      const verified = verifySignature(challenge, signature, keyPair.publicKey)

      expect(verified).toEqual(true)
    })

    // Using a correct hardcoded key, challenge and signature triplet
    it('verifies correct signature - hardcoded EC Key (secp256k1)', (): void => {
      const { message, signature, keyPair } = Credential.EC

      const verified = verifySignature(message, signature, keyPair.public)

      expect(verified).toEqual(true)
    })

    it('returns false on signature with wrong key - EC Key (secp256k1)',
      (): void => {
        const realKeyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: 'secp256k1', // Allowed by FIDO spec
          publicKeyEncoding: {
            type: 'spki', // Key infrasructure
            format: 'pem' // Encoding format
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        })

        const fakeKeyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: 'secp256k1', // Allowed by FIDO spec
          publicKeyEncoding: {
            type: 'spki', // Key infrasructure
            format: 'pem' // Encoding format
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        })

        const signature = signer.sign(fakeKeyPair.privateKey, 'base64')
        const verified = verifySignature(
          challenge, signature, realKeyPair.publicKey)

        expect(verified).toEqual(false)
      })

    it('returns false for signature based on wrong challenge- EC Key (secp256k1)',
      (): void => {
        const realKeyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: 'secp256k1', // Allowed by FIDO spec
          publicKeyEncoding: {
            type: 'spki', // Key infrasructure
            format: 'pem' // Encoding format
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        })

        const fakeKeyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: 'secp256k1', // Allowed by FIDO spec
          publicKeyEncoding: {
            type: 'spki', // Key infrasructure
            format: 'pem' // Encoding format
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        })

        // Need another Sign object instead of updating the outer one
        // because of parallel test runs
        const anotherChallenge = 'This is a different message'
        const anotherSigner = crypto.createSign('SHA256')

        anotherSigner.update(anotherChallenge)

        const signature = signer.sign(fakeKeyPair.privateKey, 'base64')
        const verified = verifySignature(
          challenge, signature, realKeyPair.publicKey)

        expect(verified).toEqual(false)
      })

    // Using a hardcoded key, challenge and signature triplet
    // eslint-disable-next-line max-len
    it('returns false for signature based on wrong challenge - hardcoded EC Key (secp256k1)',
      (): void => {
        const { message, keyPair } = Credential.EC

        // Need another Sign object instead of updating the outer one
        // because of parallel test runs
        const anotherChallenge = 'This is a different message'
        const anotherSigner = crypto.createSign('SHA256')

        anotherSigner.update(anotherChallenge)

        const signature = signer.sign(keyPair.private, 'base64')
        const verified = verifySignature(message, signature, keyPair.public)

        expect(verified).toEqual(false)
      })

    it('verifies correct signature - RSA 2048 Key', (): void => {
      const realKeyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048 // Key length in bits
      })

      const signature = signer.sign(realKeyPair.privateKey, 'base64')
      const verified = verifySignature(
        challenge, signature, realKeyPair.publicKey)

      expect(verified).toEqual(true)
    })

    // Using a correct hardcoded key, challenge and signature triplet
    it('verifies correct signature - hardcoded RSA 2048 key', (): void => {
      const { message, signature, keyPair } = Credential.RSA

      const verified = verifySignature(message, signature, keyPair.public)

      expect(verified).toEqual(true)
    })

    it('returns false on signature based on wrong key - RSA 2048 Key',
      (): void => {
        const fakeKeyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048 // Key length in bits
        })

        const realKeyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048 // Key length in bits
        })

        const signature = signer.sign(fakeKeyPair.privateKey, 'base64')
        const verified = verifySignature(
          challenge, signature, realKeyPair.publicKey)

        expect(verified).toEqual(false)
      })

    // Using a hardcoded key, challenge and signature triplet
    // eslint-disable-next-line max-len
    it('returns false for signature based on wrong challenge - hardcoded RSA 2048 key',
      (): void => {
        const { message, keyPair } = Credential.RSA

        // Need another Sign object instead of updating the outer one
        // because of parallel test runs
        const anotherChallenge = 'This is a different message'
        const anotherSigner = crypto.createSign('SHA256')

        anotherSigner.update(anotherChallenge)

        const signature = signer.sign(keyPair.private, 'base64')
        const verified = verifySignature(message, signature, keyPair.public)

        expect(verified).toEqual(false)
      })

    it('properly uses crypto.createVerify function and handles exceptions',
      (): void => {
        const { message, keyPair } = Credential.RSA

        // Setting up mocks
        const createVerifySpy = jest.spyOn(crypto, 'createVerify')
          .mockImplementationOnce((): crypto.Verify => {
            throw new Error('Unable to create Verify in mock')
          })

        // Setting up the signature
        const anotherChallenge = 'This is a different message'
        const anotherSigner = crypto.createSign('SHA256')

        anotherSigner.update(anotherChallenge)

        const signature = signer.sign(keyPair.private, 'base64')

        // Assertions
        expect((): void => {
          verifySignature(message, signature, keyPair.public)
        }).toThrowError('Unable to create Verify in mock')

        // Verify that crypto function is called correctly
        expect(createVerifySpy).toHaveBeenCalledWith('SHA256')
        expect(createVerifySpy).toHaveBeenCalledTimes(1)
        // Verify that logger functions are called correctly
        // expect(mocked(logger.push))
        //   .toHaveBeenCalledWith({ error: new Error('Unable to create Verify in mock') })
        // expect(mocked(logger.push)).toHaveBeenCalledTimes(1)

        // expect(mocked(logger.error)).toHaveBeenCalledTimes(1)
        // expect(mocked(logger.error)).toHaveBeenCalledWith('Unable to verify signature')
      })
  })
})
