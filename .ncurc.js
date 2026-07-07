module.exports = {
  reject: [
    // @types/node must stay on the 24.x line: its major must match the .nvmrc runtime
    // major (24.x). Higher majors only weaken type checking (tsc accepts Node-26-only
    // APIs that crash at runtime — untestable failure mode).
    '@types/node',
    // redis@6 removes the v3 callback client API this service is written against.
    // Verified 2026-07-07 with redis@6.1.0: tsc fails with
    // "src/shared/redis-connection.ts(90,24): error TS2314: Generic type
    // 'RedisClient<M, F, S, RESP, TYPE_MAPPING>' requires 5 type argument(s)" and
    // "src/shared/redis-connection.ts(165,46): error TS2554: Expected 0-1 arguments,
    // but got 2" (callback-style get/set/del/quit no longer exist).
    'redis',
    // @types/redis@4 is a stub for the redis@4+ built-in types; incompatible with
    // redis@3 (same TS2314 errors as above).
    '@types/redis'
  ]
}
