module.exports = {
  reject: [
    // Caution advised in upgrading redis-mock past 0.52.0. Investigation needed.
    'redis-mock',
    // Upgrading past redis@3 to the next major version introduces a lot of breaking changes.
    'redis',
    '@types/redis',
    // Upgrading fido2-lib past @2.8.3 seems to break tests with error message
    // `error parsing ASN.1`. Investigation needed.
    'fido2-lib',
    // upgrading eslint beyond v8.56.0 causes peer dependency conflict with @typescript-eslint/parser and @typescript-eslint/eslint-plugin
    // can be upgrade when the dependent packages are updated
    "eslint",
    // @hapi/hapi past v21.3.2 introduces some type export errors
    "@hapi/hapi"
  ]
}
