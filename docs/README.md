# auth-service/Docs

Documentation for the auth service
## Database

The following Figure depicts the Entity Relationship Diagram of the auth-service's schema:

<p align="center">
  <img src="http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/spikerheado1234/auth-service/master/docs/ErDiagram.puml">
</p>

The following table depicts the types of each attribute in the `Consent` table along with the constraints:

|Attribute| Represented Internal Type | Constraints| Description |
|:---------:|:---------------------------:|:------------:|:---------------------------:|
|`id`|`VARCHAR(36)`|Unique - Primary Key|Alphanumeric consent ID|
|`initiator_id`|`VARCHAR(32)`|Non-Null|Alphanumeric PISP ID|
|`participant_id`|`VARCHAR(32)`|Non-Null|Alphanumeric DFSP ID|
|`created_at`|`TIMESTAMP`|Non-Null|Timestamp of consent creation|
|`credential_id`|`CHAR(256)`|Nullable|Unsigned numeric ID - upto 2^32 records|
|`credential_type`|`VARCHAR(16)`|Nullable|Alphanumeric enum value|
|`credential_status`|`VARCHAR(10)`|Nullable|String - `PENDING`/`ACTIVE`|
|`credential_payload`|`TEXT`|Nullable|Public key string|
|`credential_challenge`|`CHAR(128)`|Nullable|Base 64 encoded challenge string|

The following table depicts the types of each attribute in the `Scope` table:

|Attribute| Represented Internal Type | Constraints| Description |
|:---------:|:---------------------------:|:------------:|:---------------------------:|
|`id`|`VARCHAR(36)`|Unique - Primary Key|Alphanumeric Scope ID|
|`consent_id`|`VARCHAR(36)`|Non-Null - Foreign Key|Foreign Key for `id` in the `Consent` table|
|`action`|`VARCHAR(36)`|Non-Null|Account scope (enum) action allowed with corresponding consent|
|`account_id`|`VARCHAR(36)`|Non-Null|Account id for associated scope|

Based on [Mojaloop ThirdParty API definition](https://github.com/mojaloop/pisp/blob/7c1b878c720b64bc09f50f13962ebe24e117cc3c/docs/thirdparty-rest-v1.0-OpenApi.yaml) and Sequence Diagrams

The Credential attributes (ID, Type, Status etc.) are NULL when the authentication service initially receives the Consent information from the switch. The Credential information is populated in the following requests as the service receives credential information from the PISP, generates a challenge and verifies it.

We do not require the storing of `credential_signatures` because they are used as one of values to verify the aunthenticity of a user as described in the [fido-alliance](https://fidoalliance.org/specs/fido-u2f-v1.2-ps-20170411/fido-u2f-overview-v1.2-ps-20170411.html#authentication-generating-a-signature)

## BDD

[jest-cucumber](https://github.com/bencompton/jest-cucumber) allows to use `jest` to execute Gherkin scenarios. Thanks to `jest` we are getting also code coverage for BDD Scenarios.

in `test/features` are Feature/Scenarios in `.feature` files which contain declarations in Gherkin language.

in `test/step-definitions` are Steps implementations in `.step.ts` files.

Execute scenarios and report code coverage:
```bash
npm run test:bdd
```

## unit testing

`Jest` setup, which allows to prepare unit tests specified in `test/**/*.(spec|test).ts` files. Coverage report is always generated. If the speed of unit tests will go very slow we will refactor configuration to generate coverage only on demand.

```bash
npm run test:unit
```

If you want to generate test report in `junit` format do:
```bash
npm run test:junit
```

There is `mojaloop` convention to use `test/unit` path to keep tests. The placement of test folder should be similar to placement of tested code in `src` folder

## linting

[eslint]() setup compatible with javascript [standard](https://standardjs.com/) and dedicated for TypeScript [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint).
  - it is much more flexible
  - has good support for editors to visualize linting problem during typing.

To lint all files simply run
```bash
npm run lint
```

### linting & auto fixing via pre-commit `husky` hook
Committing untested and bad formatted code to repo is bad behavior, so we use [husky](https://www.npmjs.com/package/husky) integrated with [lint-staged](https://www.npmjs.com/package/lint-staged). 

There is defined `pre-commit` hook which runs linting only for staged files, so execution time is as fast as possible - only staged files are linted and if possible automatically fixed.

Corresponding excerpt from package.json:

```json
 "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run test:unit",
      "post-commit": "git update-index --again"
    }
  },
  "lint-staged": {
    "*.{js,ts}": "eslint --cache --fix"
  }
```

## Conventional commits:

> __Motivation:__
> 
> Using conventional commits helps standardize the format of commit messages and allows automatic generation of [CHANGELOG.md](../CHANGELOG.md) file.

See the available commands
```bash
npm run release -- --help
```

Generate the first release
```bash
npm run release -- --first-release
```

Generate a new release
```bash
npm run release
```

Generate a new minor release
```bash
npm run release -- --release-as minor
```

Generate an unnamed pre-release
```bash
npm run release -- --prerelase
```

Generate the named "alpha" pre-release
```bash
npm run release -- --prerelase alpha
```

### Docker setup
Minimal working Docker image you can find in [Dockerfile](../Dockerfile).

To build the image
```bash
npm run docker:build
```

To run the image with attached the log output to your terminal
```bash
npm run docker:run
```

When the image is run you should be able to reach the dockerized _auth-service_ exposed on `http://localhost:4004`.

If you already added the `127.0.0.1 auth-service.local` entry in your `/etc/hosts` then the _auth-service_ is reachable on `http://auth-service.local:4004`.


### external links

- [about conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [conventional-changelog-config-spec](https://github.com/conventional-changelog/conventional-changelog-config-spec/tree/master/versions/2.1.0)

