import crypto from 'crypto'
import Logger from '@mojaloop/central-services-logger'
import Credential from './credential'
import { generate, verifySign } from '../../../src/lib/challenge'

describe('Challenge Generation', (): void => {
  it('Should return a 32 byte string by default', async (): Promise<void> => {
    const challenge = await generate()
    expect(Buffer.byteLength(challenge, 'base64')).toBe(32)
  })

  it('Should return a 64 byte string if argument passed', async (): Promise<void> => {
    const challenge = await generate(64)
    expect(Buffer.byteLength(challenge, 'base64')).toBe(64)
  })

  it('Should return a 64 byte string even if negative argument passed', async (): Promise<void> => {
    const challenge = await generate(-64)
    expect(Buffer.byteLength(challenge, 'base64')).toBe(64)
  })

  it('Should return a 50 byte string even if float point argument passed', async (): Promise<void> => {
    const challenge = await generate(49.88)
    expect(Buffer.byteLength(challenge, 'base64')).toBe(50)
  })

  it('Should return a 8 byte string even if negative float point argument passed', async (): Promise<void> => {
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

    const sign = signer.sign(keyPair.privateKey, 'base64')
    const verified = verifySign(challenge, sign, keyPair.publicKey)

    expect(verified).toEqual(true)
  })

  // Using a correct hardcoded key, challenge and sign triplet
  it('verifies correct signature - hardcoded EC Key (secp256k1)', (): void => {
    const { message, signature, keyPair } = Credential.EC

    const verified = verifySign(message, signature, keyPair.public)

    expect(verified).toEqual(true)
  })

  it('returns false on signature with wrong key - EC Key (secp256k1)', (): void => {
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

    const sign = signer.sign(fakeKeyPair.privateKey, 'base64')
    const verified = verifySign(challenge, sign, realKeyPair.publicKey)

    expect(verified).toEqual(false)
  })

  it('returns false for signature based on wrong challenge - EC Key (secp256k1)', (): void => {
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

    const sign = signer.sign(fakeKeyPair.privateKey, 'base64')
    const verified = verifySign(challenge, sign, realKeyPair.publicKey)

    expect(verified).toEqual(false)
  })

  // Using a hardcoded key, challenge and sign triplet
  it('returns false for signature based on wrong challenge - hardcoded EC Key (secp256k1)', (): void => {
    const { message, keyPair } = Credential.EC

    // Need another Sign object instead of updating the outer one
    // because of parallel test runs
    const anotherChallenge = 'This is a different message'
    const anotherSigner = crypto.createSign('SHA256')

    anotherSigner.update(anotherChallenge)

    const sign = signer.sign(keyPair.private, 'base64')
    const verified = verifySign(message, sign, keyPair.public)

    expect(verified).toEqual(false)
  })

  it('verifies correct signature - RSA 2048 Key', (): void => {
    const realKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048 // Key length in bits
    })

    const sign = signer.sign(realKeyPair.privateKey, 'base64')
    const verified = verifySign(challenge, sign, realKeyPair.publicKey)

    expect(verified).toEqual(true)
  })

  // Using a correct hardcoded key, challenge and sign triplet
  it('verifies correct signature - hardcoded RSA 2048 key', (): void => {
    const { message, signature, keyPair } = Credential.RSA

    const verified = verifySign(message, signature, keyPair.public)

    expect(verified).toEqual(true)
  })

  it('returns false on signature based on wrong key - RSA 2048 Key', (): void => {
    const fakeKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048 // Key length in bits
    })

    const realKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048 // Key length in bits
    })

    const sign = signer.sign(fakeKeyPair.privateKey, 'base64')
    const verified = verifySign(challenge, sign, realKeyPair.publicKey)

    expect(verified).toEqual(false)
  })

  // Using a hardcoded key, challenge and sign triplet
  it('returns false for signature based on wrong challenge - hardcoded RSA 2048 key', (): void => {
    const { message, keyPair } = Credential.RSA

    // Need another Sign object instead of updating the outer one
    // because of parallel test runs
    const anotherChallenge = 'This is a different message'
    const anotherSigner = crypto.createSign('SHA256')

    anotherSigner.update(anotherChallenge)

    const sign = signer.sign(keyPair.private, 'base64')
    const verified = verifySign(message, sign, keyPair.public)

    expect(verified).toEqual(false)
  })

  it('properly uses crypto functions and handles exceptions', (): void => {
    const { message, keyPair } = Credential.RSA

    // Setting up mocks
    const createVerifySpy = jest.spyOn(crypto, 'createVerify').mockImplementationOnce((): crypto.Verify => {
      throw new Error('Unable to create Verify in mock')
    })

    const loggerPushSpy = jest.spyOn(Logger, 'push')
    const loggerErrorSpy = jest.spyOn(Logger, 'error').mockImplementation((): void => {})

    // Setting up the signature
    const anotherChallenge = 'This is a different message'
    const anotherSigner = crypto.createSign('SHA256')

    anotherSigner.update(anotherChallenge)

    const sign = signer.sign(keyPair.private, 'base64')

    // Assertions
    expect((): void => {
      verifySign(message, sign, keyPair.public)
    }).toThrowError('Unable to create Verify in mock')

    // Verify that crypto function is called correctly
    expect(createVerifySpy).toHaveBeenCalledWith('SHA256')
    expect(createVerifySpy).toHaveBeenCalledTimes(1)

    // Verify that logger functions are called correctly
    expect(loggerPushSpy).toHaveBeenCalledWith(new Error('Unable to create Verify in mock'))
    expect(loggerPushSpy).toHaveBeenCalledTimes(1)

    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    expect(loggerErrorSpy).toHaveBeenCalledWith('Unable to verify signature')
  })
})
