/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License")
 and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed
 on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import { DbConnectionFormat, DbPoolFormat } from '~/shared/config-db'

describe('config-db', () => {
  describe('DbConnectionFormat', () => {
    describe('validate', () => {
      it('should validate string', () => {
        expect(DbConnectionFormat.validate('string')).toBeTruthy()
      })
      it('should throw when not object', () => {
        expect(() => DbConnectionFormat.validate(123)).toThrow()
      })
      it('should validate object', () => {
        const validDBConnect = {
          host: 'host',
          port: 1233,
          database: 'database',
          user: 'user'
        }
        expect(DbConnectionFormat.validate(validDBConnect)).toBeTruthy()
      })
      it('should validate host', () => {
        expect(() => DbConnectionFormat.validate({})).toThrow()
      })
      it('should validate port', () => {
        expect(() => DbConnectionFormat.validate({ host: 'localhost' })).toThrow()
      })
      it('should validate database', () => {
        expect(() => DbConnectionFormat.validate({ host: 'localhost', port: 3360 })).toThrow()
      })
      it('should validate user', () => {
        expect(() => DbConnectionFormat.validate({ host: 'localhost', port: 3360, database: 'database' })).toThrow()
      })
    })
    describe('coerce', () => {
      it('should work', () => {
        expect(DbConnectionFormat.coerce('zz')).toEqual('zz')
        expect(DbConnectionFormat.coerce({})).toEqual({})
      })
    })
  })

  describe('DbPoolFormat', () => {
    describe('validate', () => {
      it('should validate null', () => {
        expect(DbPoolFormat.validate(undefined)).toBeTruthy()
      })
      it('should validate object', () => {
        const validDBPool = {
          min: 10,
          max: 10,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200
        }
        expect(DbPoolFormat.validate(validDBPool)).toBeTruthy()
      })
      it('should validate min', () => {
        expect(() => DbPoolFormat.validate({})).toThrow()
      })
      it('should validate max', () => {
        expect(() => DbPoolFormat.validate({ min: 10 })).toThrow()
      })
      it('should validate acquireTimeoutMillis', () => {
        expect(() => DbPoolFormat.validate({ min: 10, max: 10 })).toThrow()
      })
      it('should validate createTimeoutMillis', () => {
        expect(() =>
          DbPoolFormat.validate({
            min: 10,
            max: 10,
            acquireTimeoutMillis: 30000
          })
        ).toThrow()
      })
      it('should validate createRetryIntervalMillis', () => {
        expect(() =>
          DbPoolFormat.validate({
            min: 10,
            max: 10,
            acquireTimeoutMillis: 30000,
            createTimeoutMillis: 30000
          })
        ).toThrow()
      })
      it('should validate reapIntervalMillis', () => {
        expect(() =>
          DbPoolFormat.validate({
            min: 10,
            max: 10,
            acquireTimeoutMillis: 30000,
            createTimeoutMillis: 30000,
            createRetryIntervalMillis: 200
          })
        ).toThrow()
      })
      it('should validate destroyTimeoutMillis', () => {
        expect(() =>
          DbPoolFormat.validate({
            min: 10,
            max: 10,
            acquireTimeoutMillis: 30000,
            createTimeoutMillis: 30000,
            createRetryIntervalMillis: 200,
            reapIntervalMillis: 1000
          })
        ).toThrow()
      })
      it('should validate idleTimeoutMillis', () => {
        expect(() =>
          DbPoolFormat.validate({
            min: 10,
            max: 10,
            acquireTimeoutMillis: 30000,
            createTimeoutMillis: 30000,
            createRetryIntervalMillis: 200,
            reapIntervalMillis: 1000,
            destroyTimeoutMillis: 5000
          })
        ).toThrow()
      })
      it('should allow allow only null or object', () => {
        expect(() => DbPoolFormat.validate(123)).toThrow()
      })
    })

    describe('coerce', () => {
      it('should work', () => {
        expect(DbPoolFormat.coerce(null)).toBeUndefined()
        expect(DbPoolFormat.coerce(undefined)).toBeUndefined()
        expect(DbPoolFormat.coerce({})).toEqual({})
      })
    })
  })
})
