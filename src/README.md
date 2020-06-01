# auth-service/src #
> all tests are located in [/test](../test/README.md) folder

## Source Code layout ##

- `src/` _auth-service_ dedicated Typescript source code.
  > there is one extra file kept outside! : `/ambient.d.ts`. More info about below.

- `src/interface` is where the `Swagger` OpenAPI definitions reside
- `src/model` is used to separate the domain code
- `src/server` the HTTP @hapi server setup 
  > [/src/server/README.md](server/README.md)
- `src/shared` all utilities and helper code 
  > [/src/shared/README.md](shared/README.md)

## auth-service command line interface CLI

### Separation of concerns
The purpose of creating `/src/cli.ts` is the separation of auth-service management from @hapi server setup. 


### Parameters
```text
src/cli.ts -h

Options:
  -V, --version        output the version number
  -p, --port <number>  listen on port (default: "4004")
  -H, --host <string>  listen on host (default: "0.0.0.0")
  -h, --help           display help for command
```


### Missing `.d.ts` for dependencies and `/ambient.d.ts` ###

To use dependency modules correctly in the Typescript environment, 
there is a need to specify module declarations. 

The perfect solution would be to request a dependency module maintainers to deliver `.d.ts` declaration files. 

Instead, to unlock the use of these dependencies, we have the special `/ambient.d.ts` file where we can keep temporary module declarations. This file intentionally is kept outside the main source code folder, so we don't pollute _auth-service_ source code with this temporary workaround.