
import makeConsent from '../../../src/domain/consent'

describe('consent', () => {
  describe('getConsent', () => {
    it('gets the consents object', async () => {
      // Arrange
      const consentModelMock = {
        // This is mocking out the model call to the database
        //These are mockConsents Database object
        getAllConsents: jest.fn(() => [{id: "1234"}])
      }
      const consentDomain = makeConsent(consentModelMock)

      // Act
      const consents = await consentDomain.getConsents()

      // Assert
      expect(consents.length).toBe(1)
      expect(consents[0]).toStrictEqual({id: "1234"})
    })

    it('thows an error when no consents are found', async () => {
      // Arrange
      const consentModelMock = {
        getAllConsents: jest.fn(() => [])
      }
      const consentDomain = makeConsent(consentModelMock)

      // Act
      const action = async () => await consentDomain.getConsents()


      // Assert
      await expect(action).rejects.toThrowError('No consents found')
    })

    it('handles the database failure gracefully')
  })
})
