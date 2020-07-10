import { generate, verifySign } from '../../../src/lib/challenge'
import crypto from 'crypto'

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

describe('Signature Verification', (): void => {
  it('verifies correct signature', async (): Promise<void> => {
    const privateKey: string = '-----BEGIN RSA PRIVATE KEY-----\n' +
      'MIICXQIBAAKBgQDCtTEic76GBqUetJ1XXrrWZcxd8vJr2raWRqBjbGpSzLqa3YLv\n' +
      'VxVeK49iSlI+5uLX/2WFJdhKAWoqO+03oH4TDSupolzZrwMFSylxGwR5jPmoNHDM\n' +
      'S3nnzUkBtdr3NCfq1C34fQV0iUGdlPtJaiiTBQPMt4KUcQ1TaazB8TzhqwIDAQAB\n' +
      'AoGAM8WeBP0lwdluelWoKJ0lrPBwgOKilw8W0aqB5y3ir5WEYL1ZnW5YXivS+l2s\n' +
      'tNELrEdapSbE9hieNBCvKMViABQXj4DRw5Dgpfz6Hc8XIzoEl68DtxL313EyouZD\n' +
      'jOiOGWW5UTBatLh05Fa5rh0FbZn8GsHrA6nhz4Fg2zGzpyECQQDi8rN6qhjEk5If\n' +
      '+fOBT+kjHZ/SLrH6OIeAJ+RYstjOfS0bWiM9Wvrhtr7DZkIUA5JNsmeANUGlCrQ2\n' +
      'cBJU2cJJAkEA26HyehCmnCkCjit7s8g3MdT0ys5WvrAFO6z3+kCbCAsGS+34EgnF\n' +
      'yz8dDdfUYP410R5+9Cs/RkYesqindsvEUwJBALCmQVXFeKnqQ99n60ZIMSwILxKn\n' +
      'Dhm6Tp5Obssryt5PSQD1VGC5pHZ0jGAEBIMXlJWtvCprScFxZ3zIFzy8kyECQQDB\n' +
      'lUhHVo3DblIWRTVPDNW5Ul5AswW6JSM3qgkXxgHfYPg3zJOuMnbn4cUWAnnq06VT\n' +
      'oHF9fPDUW9GK3yRbjNaJAkAB2Al6yY0KUhYLtWoEpQ40HlATbhNel2cn5WNs6Y5F\n' +
      '2hedvWdhS/zLzbtbSlOegp00d2/7IBghAfjAc3DE9DZw\n' +
      '-----END RSA PRIVATE KEY-----'

    const publicKey: string = '-----BEGIN PUBLIC KEY-----\n' +
      'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCtTEic76GBqUetJ1XXrrWZcxd\n' +
      '8vJr2raWRqBjbGpSzLqa3YLvVxVeK49iSlI+5uLX/2WFJdhKAWoqO+03oH4TDSup\n' +
      'olzZrwMFSylxGwR5jPmoNHDMS3nnzUkBtdr3NCfq1C34fQV0iUGdlPtJaiiTBQPM\n' +
      't4KUcQ1TaazB8TzhqwIDAQAB\n' +
      '-----END PUBLIC KEY-----'

    const challenge = 'Crypto Auth service Yay!'

    const signer = crypto.createSign('sha256')

    signer.update(challenge)

    const sign = signer.sign(privateKey, 'base64')

    expect(await verifySign(challenge, sign, publicKey)).toEqual(true)
  })

  it('returns false on incorrect signature', async (): Promise<void> => {
    // Incorrect private key for signing
    const privateKey: string = '-----BEGIN RSA PRIVATE KEY-----\n' +
      'MIICXQIBAAKBgQDCtTEic76GBqUetJ1XXrrWZcxd8vJr2raWRqBjbGpSzLqa3YLv\n' +
      'VxVeK49iSlI+5uLX/2WFJdhKAWoqO+03oH4TDSupolzZrwMFSylxGwR5jPmoNHDM\n' +
      'S3nnzUkBtdr3NCfq1C34fQV0iUGdlPtJaiiTBQPMt4KUcQ1TaazB8TzhqwIDAQAB\n' +
      'AoGAM8WeBP0lwdluelWoKJ0lrPBwgOKilw8W0aqB5y3ir5WEYL1ZnW5YXivS+l2s\n' +
      'tNELrEdapSbE9hieNBCvKMViABQXj4DRw5Dgww3lec8XIzoEl68DtxL313EyouZD\n' +
      'jOiOGWW5UTBatLh05Fa5rh0FbZn8GsHwA6nhz4Fg2zGzpyECQQDi8rN6qhjEk5If\n' +
      '+fOBT+kjHZ/SLrH6OIeAJ+RYstjOfSewbWiM9Wvrhr7DZkIUA5JNsmeANUGlCrQ2\n' +
      'cBJU2cJJAkEA26HyehCmnCkCjit73E33MdT0ys5WvrAFO6z3+kCbCAsGS+34EgnF\n' +
      'yz8dDdfUYP410R5+9Cs/RkYesqindsvEUwJBALCmQVXFeKnqQ99n60ZIMSwILxKn\n' +
      'Dhm6Tp5Obssryt5PSQD1VGC5pHZ0jGAEBIMXlJWtvCprScFxZ3zIFzy8kyECQQDB\n' +
      'lUhHVo3DblIWRTVPDNW5Ul5AswW6JSM3qgkXxgHfYPg3zJOuMnbn4cUWAnnq06VT\n' +
      'oHF9fPDUW9GK3yRbjNaJAkAB2Al6yY0KUhYLtWoEpQ40HlATbhNel2cn5WNs6Y5F\n' +
      '2hedvWdhS/zLzbtbSlOegp00d2/7IBghAfjAc3DE94R2\n' +
      '-----END RSA PRIVATE KEY-----'

    const publicKey: string = '-----BEGIN PUBLIC KEY-----\n' +
      'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCtTEic76GBqUetJ1XXrrWZcxd\n' +
      '8vJr2raWRqBjbGpSzLqa3YLvVxVeK49iSlI+5uLX/2WFJdhKAWoqO+03oH4TDSup\n' +
      'olzZrwMFSylxGwR5jPmoNHDMS3nnzUkBtdr3NCfq1C34fQV0iUGdlPtJaiiTBQPM\n' +
      't4KUcQ1TaazB8TzhqwIDAQAB\n' +
      '-----END PUBLIC KEY-----'

    const challenge = 'Crypto Auth service Yay!'

    const signer = crypto.createSign('sha256')

    signer.update(challenge)

    const sign = signer.sign(privateKey, 'base64')

    expect(await verifySign(challenge, sign, publicKey)).toEqual(false)
  })
})
