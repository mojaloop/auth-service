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
    // @hapi/hapi past v21.3.2 introduces some type export errors
    "@hapi/hapi",
    // eslint v10.x has peer dep conflicts with eslint-plugin-import
    "eslint",
    // uuid v13.x is ESM-only, breaks Jest
    "uuid",
    // typescript v6.x is a major version - keep on 5.x until verified
    "typescript"
  ]
}
