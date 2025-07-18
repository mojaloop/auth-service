import { HTTPResponseError, ResponseErrorData } from '~/shared/http-response-error'
import { Errors, Logger as SDKLogger } from '@mojaloop/sdk-standard-components'

export interface MojaloopApiErrorCode {
  code: string
  message: string
  httpStatusCode?: number
}

export function reformatError(
  err: Error | MojaloopApiErrorCode,
  logger: SDKLogger.SdkLogger
): Errors.MojaloopApiErrorObject {
  // default 500 error
  let mojaloopErrorCode: MojaloopApiErrorCode = Errors.MojaloopApiErrorCodes.INTERNAL_SERVER_ERROR
  if (err instanceof HTTPResponseError) {
    const e: ResponseErrorData = err.getData()
    if (e.res && (e.res.body || e.res.data)) {
      console.log('1')
      if (e.res.body) {
        console.log('2')
        try {
          const bodyObj = JSON.parse(e.res.body)
          mojaloopErrorCode = Errors.MojaloopApiErrorCodeFromCode(`${bodyObj.statusCode}`)
        } catch (ex) {
          // do nothing, only log problems
          logger.push({ exception: ex instanceof Error ? { message: ex.message } : String(ex) })
          logger.error('Error parsing error message body as JSON')
        }
      } else if (e.res.data) {
        mojaloopErrorCode = Errors.MojaloopApiErrorCodeFromCode(`${e.res.data.statusCode}`)
      }
    }
    // check are we having valid MojaloopApiErrorCodes object thrown
  } else {
    // error is valid when it is defined on the common list
    const code = (err as MojaloopApiErrorCode).code
    const exist = typeof Errors.MojaloopApiErrorCodeFromCode(code) !== 'undefined'
    if (exist) {
      mojaloopErrorCode = err as MojaloopApiErrorCode
    }
  }

  return new Errors.MojaloopFSPIOPError(
    err as Error,
    mojaloopErrorCode.message || err.message,
    null as unknown as string,
    mojaloopErrorCode
  ).toApiErrorObject()
}

export default {
  reformatError
}
