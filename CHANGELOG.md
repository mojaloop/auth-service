# Changelog: [mojaloop/auth-service](https://github.com/mojaloop/auth-service)
### [11.8.1](https://github.com/mojaloop/auth-service/compare/v11.8.0...v11.8.1) (2021-08-20)


### Code Refactor

* restructure consent model for updated api ([#85](https://github.com/mojaloop/auth-service/issues/85)) ([7999312](https://github.com/mojaloop/auth-service/commit/79993124281644b82d60fb7904312b4a955e938c))

## [11.8.0](https://github.com/mojaloop/auth-service/compare/v11.7.1...v11.8.0) (2021-08-16)


### Features

* **integration:** verifications tests ([#86](https://github.com/mojaloop/auth-service/issues/86)) ([88e1ca3](https://github.com/mojaloop/auth-service/commit/88e1ca3971357d453fecb9b9d608a787eb3f2336))

### [11.7.1](https://github.com/mojaloop/auth-service/compare/v11.7.0...v11.7.1) (2021-08-12)


### Maintenance

* **deps:** bump path-parse from 1.0.6 to 1.0.7 ([#84](https://github.com/mojaloop/auth-service/issues/84)) ([5291e66](https://github.com/mojaloop/auth-service/commit/5291e66e7ae820857aa88c89105991d531195914))

## [11.7.0](https://github.com/mojaloop/auth-service/compare/v11.6.0...v11.7.0) (2021-08-09)


### Features

* **api:** add `/thirpartyRequests/verifications` resource support ([#83](https://github.com/mojaloop/auth-service/issues/83)) ([d6e2137](https://github.com/mojaloop/auth-service/commit/d6e213760773bd3212d40a95306b86e63606943e))

## [11.6.0](https://github.com/mojaloop/auth-service/compare/v11.5.2...v11.6.0) (2021-08-02)


### Features

* complete account linking workflow ([#82](https://github.com/mojaloop/auth-service/issues/82)) ([da22b5e](https://github.com/mojaloop/auth-service/commit/da22b5e5b6a4017a19d88a97d40d4ba536de7531))

### [11.5.2](https://github.com/mojaloop/auth-service/compare/v11.5.1...v11.5.2) (2021-07-21)


### Maintenance

* add fido2-lib ([#80](https://github.com/mojaloop/auth-service/issues/80)) ([a6a9704](https://github.com/mojaloop/auth-service/commit/a6a9704d0650f938aed7301e1bfe37b3d7934fff))

### [11.5.1](https://github.com/mojaloop/auth-service/compare/v11.5.0...v11.5.1) (2021-07-16)


### Bug Fixes

* add missing content-type header ([#81](https://github.com/mojaloop/auth-service/issues/81)) ([a7f9758](https://github.com/mojaloop/auth-service/commit/a7f9758ab331724a46673e4b7fe033c3bdc92ab8))

## [11.5.0](https://github.com/mojaloop/auth-service/compare/v11.4.4...v11.5.0) (2021-07-13)


### Features

* implement register consent flow ([#79](https://github.com/mojaloop/auth-service/issues/79)) ([0c99035](https://github.com/mojaloop/auth-service/commit/0c99035db3d94f9e9deafc267dcd3903703853e4))

### [11.4.4](https://github.com/mojaloop/auth-service/compare/v11.4.3...v11.4.4) (2021-07-08)


### Maintenance

* pull in redis/pub-sub/kvs/ttk/state plugin/state machine code for upcoming flows ([#78](https://github.com/mojaloop/auth-service/issues/78)) ([3309b3c](https://github.com/mojaloop/auth-service/commit/3309b3c923f7f07c1b427f7adbe5a332127002be))

### [11.4.3](https://github.com/mojaloop/auth-service/compare/v11.4.2...v11.4.3) (2021-07-07)


### Maintenance

* **deps:** bump y18n from 4.0.0 to 4.0.3 ([#76](https://github.com/mojaloop/auth-service/issues/76)) ([aeb71af](https://github.com/mojaloop/auth-service/commit/aeb71af6a0bfc5cb82e7f13af421f66fd2768d6c))

### [11.4.2](https://github.com/mojaloop/auth-service/compare/v11.4.1...v11.4.2) (2021-07-07)


### Maintenance

* update packages and regen audit resolve ([#77](https://github.com/mojaloop/auth-service/issues/77)) ([8f1c3db](https://github.com/mojaloop/auth-service/commit/8f1c3db46833218e4d50ac98b2eaa2d388fd5e62))

### [11.4.1](https://github.com/mojaloop/auth-service/compare/v11.4.0...v11.4.1) (2021-07-06)


### Code Refactor

* edit handlers in prep for funtionality and cleanup old endpoints ([#75](https://github.com/mojaloop/auth-service/issues/75)) ([1d5abee](https://github.com/mojaloop/auth-service/commit/1d5abee09e5390811d2c75deacbde18ff0c876f1))

## [11.4.0](https://github.com/mojaloop/auth-service/compare/v11.3.3...v11.4.0) (2021-06-25)


### Features

* update db schema for clientDataJSON and attestationObject ([#73](https://github.com/mojaloop/auth-service/issues/73)) ([160b684](https://github.com/mojaloop/auth-service/commit/160b684607d86c19ae81c3188725aa73d17a1f4c))

### [11.3.3](https://github.com/mojaloop/auth-service/compare/v11.3.2...v11.3.3) (2021-06-02)


### Code Refactor

* 2132 soc handlers ([#69](https://github.com/mojaloop/auth-service/issues/69)) ([846f269](https://github.com/mojaloop/auth-service/commit/846f26955f44c8250447c32f46275867471563a2))

### [11.3.2](https://github.com/mojaloop/auth-service/compare/v11.3.1...v11.3.2) (2021-05-14)


### Code Refactor

* **config:** merge db & service config into one ([#67](https://github.com/mojaloop/auth-service/issues/67)) ([a0ecf8a](https://github.com/mojaloop/auth-service/commit/a0ecf8ac1cfb71397c2e9e2341c528785e36de72))

### [11.3.1](https://github.com/mojaloop/auth-service/compare/v11.3.0...v11.3.1) (2021-05-12)


### Maintenance

* 2132 update deps & fix unit tests ([#64](https://github.com/mojaloop/auth-service/issues/64)) ([8efd754](https://github.com/mojaloop/auth-service/commit/8efd754417e09448bc86c6ab5af37c71a6a1e153))

## [11.3.0](https://github.com/mojaloop/auth-service/compare/v11.2.8...v11.3.0) (2021-03-24)


### Features

* use api-snippets(thirdparty-api paths) in place of local defs ([#61](https://github.com/mojaloop/auth-service/issues/61)) ([3667b9a](https://github.com/mojaloop/auth-service/commit/3667b9a78503809641abf3071cb05986739b9a36))


### Maintenance

* update license file ([#57](https://github.com/mojaloop/auth-service/issues/57)) ([85dc2a3](https://github.com/mojaloop/auth-service/commit/85dc2a317838131d01ed20f6e1fd029c45306887))
* **deps:** bump ini from 1.3.5 to 1.3.8 ([#58](https://github.com/mojaloop/auth-service/issues/58)) ([f056c02](https://github.com/mojaloop/auth-service/commit/f056c025fe648c988954ed4271baf3043c8a5adc))

### [11.2.8](https://github.com/mojaloop/auth-service/compare/v11.2.7...v11.2.8) (2020-10-20)

### [11.2.7](https://github.com/mojaloop/auth-service/compare/v11.2.6...v11.2.7) (2020-10-14)


### Bug Fixes

* 432 logger ([#56](https://github.com/mojaloop/auth-service/issues/56)) ([71ec4e8](https://github.com/mojaloop/auth-service/commit/71ec4e852469f28cf3a45d68e9ebf91838fca001))

### [11.2.6](https://github.com/mojaloop/auth-service/compare/v11.2.5...v11.2.6) (2020-10-14)

### [11.2.5](https://github.com/mojaloop/auth-service/compare/v11.2.4...v11.2.5) (2020-10-14)

### [11.2.4](https://github.com/mojaloop/auth-service/compare/v11.2.3...v11.2.4) (2020-10-09)


### Bug Fixes

* **ci/cd:** explicitly disable `license-scan` and `image-scan` steps ([#54](https://github.com/mojaloop/auth-service/issues/54)) ([6c75243](https://github.com/mojaloop/auth-service/commit/6c752436eec1127ee887c8fd5e66bcbef3eece03))

### [11.2.3](https://github.com/mojaloop/auth-service/compare/v11.2.2...v11.2.3) (2020-10-09)


### Bug Fixes

* **ci/cd:** disable license scan and audit temporarily. Waiting for fix in mojaloop/mojaloop[#415](https://github.com/mojaloop/auth-service/issues/415) ([#53](https://github.com/mojaloop/auth-service/issues/53)) ([79d7d8c](https://github.com/mojaloop/auth-service/commit/79d7d8c82acff8f6a3dae26c1fb75ce2d940f9a7))

### [11.2.2](https://github.com/mojaloop/auth-service/compare/v11.2.1...v11.2.2) (2020-09-28)

### [11.2.1](https://github.com/mojaloop/auth-service/compare/v11.2.0...v11.2.1) (2020-09-17)

## [11.2.0](https://github.com/mojaloop/auth-service/compare/v11.1.1...v11.2.0) (2020-09-16)


### Features

* **test:** api route testing ([#45](https://github.com/mojaloop/auth-service/issues/45)) ([35ed146](https://github.com/mojaloop/auth-service/commit/35ed14668f7cd83148c158737a4492479b70d6af))

### [11.1.1](https://github.com/mojaloop/auth-service/compare/v11.1.0...v11.1.1) (2020-09-08)

## [11.1.0](https://github.com/mojaloop/auth-service/compare/v11.0.2...v11.1.0) (2020-08-24)

### [11.0.2](https://github.com/mojaloop/auth-service/compare/v11.0.1...v11.0.2) (2020-08-21)

### [11.0.1](https://github.com/mojaloop/auth-service/compare/v11.0.0...v11.0.1) (2020-08-17)

## [11.0.0](https://github.com/mojaloop/auth-service/compare/v0.1.7...v11.0.0) (2020-08-14)


### ⚠ BREAKING CHANGES

* **circleci:** add steps to circleci to automate github release (#39)

### Features

* **bdd:** Add bdd scenarios for account linking ([#7](https://github.com/mojaloop/auth-service/issues/7)) ([ff073a7](https://github.com/mojaloop/auth-service/commit/ff073a78d534d2ea84c30c2771a64da9f7c9990f))
* **commits:** added linter to enforce conventional commit messages ([#27](https://github.com/mojaloop/auth-service/issues/27)) ([06da856](https://github.com/mojaloop/auth-service/commit/06da856fa02b257d7839d72ab3a355a82be6d00b))
* **swagger:** Add new Auth Service endpoints to swagger.json ([#8](https://github.com/mojaloop/auth-service/issues/8)) ([bc8774d](https://github.com/mojaloop/auth-service/commit/bc8774da9d96dfbb0dab65381fd629ae45d1ba38)), closes [#280](https://github.com/mojaloop/auth-service/issues/280)


### Maintenance

* **circleci:** add steps to circleci to automate github release ([#39](https://github.com/mojaloop/auth-service/issues/39)) ([156cbae](https://github.com/mojaloop/auth-service/commit/156cbae4941dd86759c926a16d3c39212321fa73))

### [0.1.8](https://github.com/mojaloop/auth-service/compare/v0.1.7...v0.1.8) (2020-06-09)


### Maintenance

* **package.json:** fix description ([45b9cda](https://github.com/mojaloop/auth-service/commit/45b9cda5434e59747fa6095fb94a6ebcadbb0cdb))

### [0.1.7](https://github.com/mojaloop/auth-service/compare/v0.1.6...v0.1.7) (2020-06-01)


### Maintenance

* audit-resolve ([a33bdb9](https://github.com/mojaloop/auth-service/commit/a33bdb95830015874cf0a27bef2297f78b082e24))
* **package.json:** fix wrong repository.url ([4b82b1c](https://github.com/mojaloop/auth-service/commit/4b82b1ca4f14b5955dc9ae9040abe2951b47f650))

### [0.1.6](https://github.com/mojaloop/AuthService/compare/v0.1.5...v0.1.6) (2020-05-29)


### Features

* **server:** minimal hapi server ([5c0b1f1](https://github.com/mojaloop/AuthService/commit/5c0b1f1a2667d0f25d6b1d60c8b8ec5a89adf271))


### Bug Fixes

* email in comments ([af6f537](https://github.com/mojaloop/AuthService/commit/af6f53715544ed3a57b4ae5598f96b683450863a))
* **Dockerfile:** correct WORKDIR & EXPOSE ([2ca5087](https://github.com/mojaloop/AuthService/commit/2ca50876ad382ce73f4de32764f60de96ea74243))


### Maintenance

* **docerkignore:** specify what ignore for image ([ba4b0e7](https://github.com/mojaloop/AuthService/commit/ba4b0e79736166d60412e5faaa62ea9e03d3fc06))
* **Docker:** additional Docker package scripts ([3c25883](https://github.com/mojaloop/AuthService/commit/3c25883f85ef3143571b3f027224a441b30dec7d))
* **Dockerfile:** go for node v14.3.0 ([8a91987](https://github.com/mojaloop/AuthService/commit/8a91987718ee4a3511f80f4d1a3ea11021b75439))
* **eslint:** allow console ([c8aef86](https://github.com/mojaloop/AuthService/commit/c8aef862d371b91fda237ec38057fcdd1085d057))


### Documentation

* **README:** add info about local Docker and howto run AuthService ([8ef3d45](https://github.com/mojaloop/AuthService/commit/8ef3d45dabbc5a9d5be451322de0dd8b585f601f))

### [0.1.5](https://github.com/mojaloop/auth-service/compare/v0.1.4...v0.1.5) (2020-05-22)


### Style Improvements

* **CHANGELOG:** restyle header ([e78234f](https://github.com/mojaloop/auth-service/commit/e78234f5cdbc3e93c72b6bdd024f69f2d4f68193))

### [0.1.4](https://github.com/mojaloop/auth-service/compare/v0.1.3...v0.1.4) (2020-05-22)


### Documentation

* **readme:** fix layout ([24bc1bd](https://github.com/mojaloop/auth-service/commit/24bc1bd07ecdcc26a0574e82b91e14954cc7671f))
* **readme:** reformat docs, add motivation ([9bdda1f](https://github.com/mojaloop/auth-service/commit/9bdda1f5b771b7efc2f5c696a9cdcd9f6b76f05f))

### [0.1.3](https://github.com/mojaloop/auth-service/compare/v0.1.2...v0.1.3) (2020-05-22)


### Maintenance

* **versionrc:** show all types ([b5caad2](https://github.com/mojaloop/auth-service/commit/b5caad2c35cef0b3bf1d6b503b9d1e4fdead6844))

### [0.1.2](https://github.com/mojaloop/auth-service/compare/v0.1.1...v0.1.2) (2020-05-22)

### [0.1.1](https://github.com/mojaloop/auth-service/compare/v0.1.0...v0.1.1) (2020-05-22)

## 0.1.0 (2020-05-22)
