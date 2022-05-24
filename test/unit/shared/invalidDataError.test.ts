import { InvalidDataError } from '~/shared/invalidDataError'
import shouldNotBeExecuted from '../shouldNotBeExecuted'

describe('invalidDataError', () => {
  describe('throwIfInvalidProperty', () => {
    it('throws if it finds an invalid property', () => {
      // Arrange
      const record: Record<string, string> = {
        a: '1',
        b: '2',
        c: '3'
      }

      // Act
      try {
        InvalidDataError.throwIfInvalidProperty(record, 'd')
        shouldNotBeExecuted()
      } catch (err: any) {
        // Assert
        expect(err.message).toBe('invalid d data')
      }
    })
  })
})
