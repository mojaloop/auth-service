module.exports = {
  // format version sem-ver
  // `v{major}.${minor}.${patch}`
  wait4: 'v0.1.0',

  // How many times should we retry waiting for a service?
  retries: 10,

  // How many ms to wait before retrying a service connection?
  waitMs: 2500,

  // services definitions
  services: [
    {
      name: 'auth-service-integration',

      // list of services to wait for
      wait4: [
        {
          description: 'MySQL Database',
          /* Change host:port accordingly based on default.json attributbes. */
          uri: 'localhost:3306',
          method: 'mysql',
          retries: 30
        },
        {
          description: 'Auth Service',
          /* Change host:port accordingly based on default.json attributbes. */
          uri: 'localhost:4004',
          method: 'ncat',
          retries: 30
        }
      ]
    }
  ]
}
