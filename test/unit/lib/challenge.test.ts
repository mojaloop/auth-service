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

 --------------
 ******/
import crypto from 'crypto'
import Logger from '@mojaloop/central-services-logger'
import Credential from './credential'
import { generate, verifySignature } from '~/lib/challenge'

describe('Challenge Generation', (): void => {
  it('Should return a 32 byte string by default', async (): Promise<void> => {
    const challenge = await generate()
    expect(Buffer.byteLength(challenge, 'base64')).toBe(32)
  })

  it('Should return a 64 byte string if argument passed',
    async (): Promise<void> => {
      const challenge = await generate(64)
      expect(Buffer.byteLength(challenge, 'base64')).toBe(64)
    })

  it('Should return a 64 byte string even if negative argument passed',
    async (): Promise<void> => {
      const challenge = await generate(-64)
      expect(Buffer.byteLength(challenge, 'base64')).toBe(64)
    })

  it('Should return a 50 byte string even if float point argument passed',
    async (): Promise<void> => {
      const challenge = await generate(49.88)
      expect(Buffer.byteLength(challenge, 'base64')).toBe(50)
    })

  // eslint-disable-next-line max-len
  it('Should return a 8 byte string even if negative float point argument passed',
    async (): Promise<void> => {
      const challenge = await generate(-8.1)
      expect(Buffer.byteLength(challenge, 'base64')).toBe(8)
    })
})

/*
 * Signature Verification Unit Tests
 *
 * Currently, the tests focus on RSA 2048 and ECDSA:secp256k1 keys.
 * Support for additional keys can be extended further.
 */
describe('Signature Verification', (): void => {
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

      const loggerPushSpy = jest.spyOn(Logger, 'push')
      // Mocking `Logger.error` because it indirectly calls
      // Logger.push and we want to only test usage of Logger's interface
      const loggerErrorSpy = jest.spyOn(Logger, 'error')
        .mockImplementation((): void => {})

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
      expect(loggerPushSpy)
        .toHaveBeenCalledWith(new Error('Unable to create Verify in mock'))
      expect(loggerPushSpy).toHaveBeenCalledTimes(1)

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
      expect(loggerErrorSpy).toHaveBeenCalledWith('Unable to verify signature')
    })
})
