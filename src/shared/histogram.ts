import { Request, ResponseToolkit, ResponseObject } from '@hapi/hapi'
import Metrics from '@mojaloop/central-services-metrics'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type THandlerFunc = (request: Request, h: ResponseToolkit) => Promise<ResponseObject>

/**
 * @function wrapWithHistogram
 * @description Wraps a handler function with a histogram of the given name
 * @param {THandlerFunc} handler The handler function to be wrapped
 * @param {[string, string, Array<string>]} histogramParams The params of the histogram
 */
function wrapWithHistogram (handler: THandlerFunc, histogramParams: [string, string, string[]]): THandlerFunc {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (request: Request, h: ResponseToolkit) => {
    let histTimerEnd
    try {
      histTimerEnd = Metrics.getHistogram(...histogramParams).startTimer()
      const response = await handler(request, h)
      histTimerEnd({ success: 'true' })

      return response
    } catch (err) {
      if (typeof histTimerEnd === 'function') {
        histTimerEnd({ success: 'false' })
      }
      throw err
    }
  }
}

export {
  wrapWithHistogram
}
