import FidoUtils from '~/shared/fido-utils'
import shouldNotBeExecuted from '../shouldNotBeExecuted'
import btoa from 'btoa'

describe('fido-utils', () => {
  describe('parseClientDataBase64', () => {
    it('parses the client data origin field', () => {
      // Arrange
      const validData = 'eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiWXpSaFpHRmlZak16WlRrek1EWmlNRE00TURnNE1UTXlZV1ptWTJSbE5UVTJZelV3WkRneVpqWXdNMlkwTnpjeE1XRTVOVEV3WW1ZelltVmxaalprTmciLCJvcmlnaW4iOiJodHRwOi8vbG9jYWxob3N0OjQyMTgxIiwiY3Jvc3NPcmlnaW4iOmZhbHNlfQ=='

      // Act
      const clientData = FidoUtils.parseClientDataBase64(validData)

      // Assert
      expect(clientData).toStrictEqual({
        challenge: 'YzRhZGFiYjMzZTkzMDZiMDM4MDg4MTMyYWZmY2RlNTU2YzUwZDgyZjYwM2Y0NzcxMWE5NTEwYmYzYmVlZjZkNg',
        crossOrigin: false,
        origin: 'http://localhost:42181',
        type: 'webauthn.create'
      })
    })

    it('fails if missing the client data origin field', () => {
      // Arrange
      const missingOriginJSON = '{"challenge":"YzRhZGFiYjMzZTkzMDZiMDM4MDg4MTMyYWZmY2RlNTU2YzUwZDgyZjYwM2Y0NzcxMWE5NTEwYmYzYmVlZjZkNg","crossOrigin":false,"type":"webauthn.create"}'
      const invalidData = btoa(missingOriginJSON)

      // Act
      try {
        FidoUtils.parseClientDataBase64(invalidData)
        shouldNotBeExecuted()
      } catch (err: any) {
        // Assert
        expect(err.message).toMatch('ClientData is missing .origin field')
      }
    })
  })
})
