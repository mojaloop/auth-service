# Auth Service (Work in Progress)
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/AuthService.svg?style=flat)](https://github.com/mojaloop/auth-service/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/AuthService.svg?style=flat)](https://github.com/mojaloop/auth-service/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/AuthService.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/auth-service)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/AuthService.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/auth-service)
[![CircleCI](https://circleci.com/gh/mojaloop/AuthService.svg?style=svg)](https://circleci.com/gh/mojaloop/auth-service)

Mojaloop central AuthZ + AuthN service. Currently for FIDO implementation in a Mojaloop switch.

## Overview

- [Documentation](./docs/README.md)

## Setup

### Clone repo
```bash
git clone git@github.com:mojaloop/AuthService.git
```

### Improve local DNS resolver
Add the `127.0.0.1   AuthService.local` entry in your `/etc/hosts` so the _auth-service_ is reachable on `http://AuthService.local:4004`. Elsewhere use `http://localhost:4004`

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

To check the auth-service health visit [http://AuthService.local:4004/health](http://AuthService.local:4004/health)

