module.exports = {
  reject: [
    // Caution advised in upgrading redis-mock past 0.52.0. Investigation needed.
    'redis-mock',
    // Upgrading past redis@3 to the next major version introduces a lot of breaking changes.
    'redis',
    '@types/redis',
    // Upgrading sqlite past 5.0.2 seems to introduce sh: 1: node-pre-gyp: not found.
    // Investigation needed.
    'sqlite3',
    // Upgrading fido2-lib past @2.8.3 seems to break tests with error message
    // `error parsing ASN.1`. Investigation needed.
    'fido2-lib'
  ]
}
