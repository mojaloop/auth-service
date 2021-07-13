import { HTTPResponseError, ResponseErrorData } from '~/shared/http-response-error'
import { Errors, Logger as SDKLogger } from '@mojaloop/sdk-standard-components'
import { reformatError } from '~/shared/api-error'

import mockLogger from '../mockLogger'

describe('api-error', () => {
  describe('reformatError', () => {
    let logger: SDKLogger.Logger

    beforeEach(() => {
      logger = mockLogger()
    })

    it('should reformat any Error', () => {
      const err = new Error('any-error')
      const result = reformatError(err, logger)
      expect(result).toEqual({
        errorInformation: {
          errorCode: '2001',
          errorDescription: 'Internal server error'
        }
      })
    })

    it('should reformat HTTPResponseError', () => {
      const err = new HTTPResponseError<ResponseErrorData>(
        { msg: 'some-message', res: { data: { statusCode: 7200 } } }
      )
      const result = reformatError(err, logger)
      expect(result).toEqual({
        errorInformation: {
          errorCode: '7200',
          errorDescription: 'Generic Thirdparty account linking error'
        }
      })
    })

    it('should report json parsing errors', () => {
      const err = new HTTPResponseError<ResponseErrorData>(
        { msg: 'some-message', res: { body: '[' } }
      )
      const result = reformatError(err, logger)
      expect(result).toEqual({
        errorInformation: {
          errorCode: '2001',
          errorDescription: 'Internal server error'
        }
      })
      expect(logger.push).toHaveBeenCalledWith({ exception: expect.anything() })
    })

    it('should preserve existing MojaloopApiErrorCode', () => {
      const err = Errors.MojaloopApiErrorCodes.TP_FSP_OTP_VALIDATION_ERROR
      const result = reformatError(err, logger)
      expect(result).toEqual({
        errorInformation: {
          errorCode: '7206',
          errorDescription: 'FSP failed to validate OTP'
        }
      })
    })

    it('should handle non-existing MojaloopApiErrorCode', () => {
      const result = reformatError({ code: '-1', message: 'zzz' }, logger)
      expect(result).toEqual({
        errorInformation: {
          errorCode: '2001',
          errorDescription: 'Internal server error'
        }
      })
    })
  })
})
