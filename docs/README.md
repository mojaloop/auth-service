# auth-service/Docs

Documentation for the auth service
## Database

The following Figure depicts the Entity Relationship Diagram of the 

![ER-Diagram](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/spikerheado1234/auth-service/master/docs/ErDiagram.puml)

The following table depicts the types of each attribute in the `Consent` table, algonside their constraints:

|Attribute| Represented Internal Type | Constraints|
|:---------:|:---------------------------:|:------------:|
|`id`|VARCHAR(36)|Unique - Primary Key|
|`initiator_id`|VARCHAR(36)|Non-Null|
|`participant_id`|VARCHAR(36)|Non-Null|
|`credential_id`|TEXT|(Can be Null)|
|`credential_type`|TEXT|(Can be Null)|
|`credential_status`|TEXT|(Can be Null)|
|`credential_payload`|TEXT|(Can be Null)|
|`credential_challenge`|TEXT|(Can be Null)|

The following table depicts the types of each attribute in the `Scope` table:

|Attribute| Represented Internal Type | Constraints|
|:---------:|:---------------------------:|:------------:|
|`id`|VARCHAR(36)|Unique - Primary Key|
|`consent_id`|VARCHAR(36)|Foreign Key referring to the `id` in the consent table|
|`scope_account_type`|VARCHAR(36)|Non-Null|
|`scope_account_number`|VARCHAR(36)|(Can be Null)|

The reason attributes pertaining to `credentials` and `scope_account_number` can be null is because of the communication sequence established in between the `PISP` and the `authorisation-service`. Where, at the point of first contact with the authorisation-service, these fields are not present. They are available during later parts in the sequence of communication in between the two services.

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

