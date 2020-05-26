import inspect from './inspect'
import logger from '@mojaloop/central-services-logger'

// https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly
function handleCriticalEvents (): void {
  process.on('unhandledRejection', (reason, promise): void => {
    logger.error(`
      UNHANDLED REJECTION at:
    
      PROMISE:
      ${inspect(promise)}
      
      REASON:
      ${inspect(reason)}
    `)
    process.exit(1)
  })

  process.on('uncaughtException', (err: Error, origin: string): void => {
    logger.error(`
      UNCAUGH EXCEPTION at:
    
      ERROR:
      ${inspect(err)}
      
      ORIGIN:
      ${inspect(origin)}
    `)
    process.exit(1)
  })
}

export {
  handleCriticalEvents
}
