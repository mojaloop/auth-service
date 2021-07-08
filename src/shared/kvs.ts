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

 - Paweł Marzec <pawel.marzec@modusbox.com>
 --------------
 ******/

import { RedisConnection } from './redis-connection'
import { promisify } from 'util'

export class InvalidKeyError extends Error {
  constructor () {
    super('key should be non empty string')
  }

  static throwIfInvalid (key: string): void {
    if (!(key?.length > 0)) {
      throw new InvalidKeyError()
    }
  }
}

// KVS class deliver simple key - value storage backed by Redis
export class KVS extends RedisConnection {
  // retrieve the value for given key
  // if there is no value for given key 'undefined' is returned
  async get<T> (key: string): Promise<T|undefined> {
    InvalidKeyError.throwIfInvalid(key)

    const asyncGet = promisify(this.client.get)
    const value: string | null | undefined = await asyncGet.call(this.client, key)

    return typeof value === 'string' ? JSON.parse(value) : undefined
  }

  // store the value for given key
  async set<T> (key: string, value: T): Promise<boolean> {
    InvalidKeyError.throwIfInvalid(key)

    const asyncSet = promisify(this.client.set)
    const stringified = JSON.stringify(value)

    return asyncSet.call(this.client, key, stringified) as Promise<boolean>
  }

  // removes the value for given key
  async del (key: string): Promise<boolean> {
    InvalidKeyError.throwIfInvalid(key)
    return this.client.del(key)
  }

  // check is any data for given key
  async exists (key: string): Promise<boolean> {
    // there is problem with TS typings
    // so using `promisify` isn't working
    return new Promise((resolve, reject) => {
      this.client.exists(key, (err: unknown, result: number) => {
        if (err) {
          return reject(err)
        }
        resolve(result === 1)
      })
    })
  }
}
