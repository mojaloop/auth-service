import { generate } from '../../../src/lib/challenge'

describe('Challenge Generation', (): void => {
  it('Should return a 32 byte string', async (): Promise<void> => {
    const challenge = await generate()
    expect(Buffer.byteLength(challenge, 'base64')).toBe(32)
  })

  it('Should return a 64 byte string', async (): Promise<void> => {
    const challenge = await generate(64)
    expect(Buffer.byteLength(challenge, 'base64')).toBe(64)
  })
})
