# auth-service/src/shared

Helper modules shared across all source code.

- `config.ts` where the server configuration managed by [RC](https://github.com/dominictarr/rc#readme) is specified
- `inspect.ts` wrapper around [util.inspect](https://nodejs.org/api/util.html#util_util_inspect_object_options) to have unified inspection with parameters specified in config
- `logger.ts` unified logging based on [@mojaloop/central-services-logger](https://github.com/mojaloop/central-services-logger)