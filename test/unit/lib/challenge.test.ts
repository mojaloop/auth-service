import crypto from 'crypto'
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
 * Currently, the tests focus on RSA and ECDSA:secp256k1 keys.
 * Support for additional keys can be extended further.
 */
describe('Signature Verification', (): void => {
  // Each test generates a random key pair
  let challenge: string
  let signer: crypto.Signer

  beforeEach((): void => {
    challenge = 'Crypto Auth service Yay!'
    signer = crypto.createSign('SHA256')

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

    const anotherChallenge = 'This is a different message'
    const anotherSigner = crypto.createSign('SHA256')

    anotherSigner.update(anotherChallenge)

    const sign = signer.sign(keyPair.private, 'base64')
    const verified = verifySign(message, sign, keyPair.public)

    expect(verified).toEqual(false)
  })

  it('verifies correct signature - RSA Key', (): void => {
    const realKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048 // Key length in bits
    })

    const sign = signer.sign(realKeyPair.privateKey, 'base64')
    const verified = verifySign(challenge, sign, realKeyPair.publicKey)

    expect(verified).toEqual(true)
  })

  it('returns false on incorrect signature - RSA Key', (): void => {
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

  it('returns false on key algorithm mismatch', (): void => {
    const fakeKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048 // Key length in bits
    })

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

    const sign = signer.sign(fakeKeyPair.privateKey, 'base64')
    const verified = verifySign(challenge, sign, realKeyPair.publicKey)

    expect(verified).toEqual(false)
  })
})
