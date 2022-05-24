module.exports = {
  reject: [
    // Upgrading past husky@4 to involves a full config migration with no current and apparent benefit.
    // So we are just sticking to husky@4.x.x for the time being.
    'husky',
    // Caution advised in upgrading redis-mock past 0.52.0. Investigation needed.
    'redis-mock',
    // Upgrading past redis@3 to the next major version introduces a lot of breaking changes.
    'redis',
    '@types/redis',
    // Upgrading past jest|ts-jest|@types/jest@26 introduces a lot of breaking changes to current tests.
    'jest',
    'ts-jest',
    '@types/jest',
    // Upgrading past commander@7 introduces a lot of breaking changes.
    'commander',
    // Upgrading sqlite past 5.0.2 seems to introduce sh: 1: node-pre-gyp: not found.
    // Investigation needed.
    'sqlite3',
    // Upgrading fido2-lib past @2.8.3 seems to break tests with error message
    // `error parsing ASN.1`. Investigation needed.
    'fido2-lib'
  ]
}
