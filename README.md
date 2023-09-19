# Auth Service (Work in Progress)
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/auth-service.svg?style=flat)](https://github.com/mojaloop/auth-service/commits/main)
[![Git Releases](https://img.shields.io/github/release/mojaloop/auth-service.svg?style=flat)](https://github.com/mojaloop/auth-service/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/auth-service.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/auth-service)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/auth-service.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/auth-service)
[![CircleCI](https://circleci.com/gh/mojaloop/auth-service.svg?style=svg)](https://circleci.com/gh/mojaloop/auth-service)

Mojaloop central AuthZ + AuthN service. Currently for FIDO implementation in a Mojaloop switch.

## Overview

- [Documentation](./docs/README.md)

## Setup

### Clone repo
```bash
git clone git@github.com:mojaloop/AuthService.git
```

### Improve local DNS resolver
Add the `127.0.0.1   auth-service.local` entry in your `/etc/hosts` so the _auth-service_ is reachable on `http://auth-service.local:4004`. Elsewhere use `http://localhost:4004`

### Install service dependencies
```bash
cd auth-service
npm ci
```

### Run local dockerized _auth-service_
```bash
npm run docker:build
npm run docker:run
```

To check the auth-service health visit [http://auth-service.local:4004/health](http://auth-service.local:4004/health)

### Run locally with database in `docker-compose` 

```bash
docker-compose up -d mysql
npm run migrate
npm run start
```


### Updating the OpenApi (Swagger) Spec

We use `multi-file-swagger` to make our swagger files more manageable.

After making changes to the `.yaml` files in `./src/interface/`, update the `swagger.json` file like so:

```bash
    npm run build:openapi
```

> Note: We will likely want to move to swagger 3.0 at some point, and once we do, we will be able to use the [common api snippets](https://github.com/mojaloop/api-snippets) library to factor out common Mojaloop snippets.
> Keep track of [#352 - Update to OpenAPI v3](https://app.zenhub.com/workspaces/pisp-5e8457b05580fb04a7fd4878/issues/mojaloop/mojaloop/352)


