/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop
 files are distributed onan 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 ANY KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
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

 - Paweł Marzec <rorkit@gmail.com>
 --------------
 ******/
import { thirdparty as tpAPI } from '@mojaloop/api-snippets'
import { decode, decodeAllSync, encode } from 'cbor'
import { createHash, createVerify } from 'crypto'

/**
 * U2F Presence constant
 */
const U2F_USER_PRESENTED = 0x01

export enum coseALG {
  ES256 = -7,
  PS256 = -37,
  RS256 = -257
}

export interface FIDOAttestationStatement {
  alg: number
  sig: Buffer
  x5c: Array<Buffer>
}

export interface FIDOAttestation {
  authData: Uint8Array
  fmt: 'fido-u2f' | 'packed'
  attStmt: FIDOAttestationStatement
}

export interface FIDOPublicKey {
  credentialId: Uint8Array
  publicKey: Map<number, number | Buffer>
}

export interface RegisterCredAuthenticatorData {
  rpIdHash: Buffer
  flagsBuf: Buffer
  flags: number
  counter: number
  counterBuf: Buffer
  aaguid: Buffer
  credID: Buffer
  COSEPublicKey: Buffer
}
/**
 * Parses authenticatorData buffer.
 * @param  {Buffer} buffer - authenticatorData buffer
 * @return {Object}        - parsed authenticatorData struct
 */
export function parseRegCredAuthData (buffer: Buffer): RegisterCredAuthenticatorData {
  const rpIdHash = buffer.slice(0, 32)
  buffer = buffer.slice(32)

  const flagsBuf = buffer.slice(0, 1)
  buffer = buffer.slice(1)

  const flags = flagsBuf[0]

  const counterBuf = buffer.slice(0, 4)
  buffer = buffer.slice(4)

  const counter = counterBuf.readUInt32BE(0)

  const aaguid = buffer.slice(0, 16)
  buffer = buffer.slice(16)

  const credIDLenBuf = buffer.slice(0, 2)
  buffer = buffer.slice(2)

  const credIDLen = credIDLenBuf.readUInt16BE(0)

  const credID = buffer.slice(0, credIDLen)
  buffer = buffer.slice(credIDLen)

  const COSEPublicKey = buffer

  return { rpIdHash, flagsBuf, flags, counter, counterBuf, aaguid, credID, COSEPublicKey }
}

export function getPublicKeyBytes (authData: Uint8Array, credentialIdLength: number): Uint8Array {
  // get the public key object
  return authData.slice(55 + credentialIdLength)
}

export function getCredentialId (authData: Uint8Array, credentialIdLength: number): Uint8Array {
  // get the credential ID
  return authData.slice(55, 55 + credentialIdLength)
}

export function getCredentialIdLength (authData: Uint8Array): number {
  // get the length of the credential ID
  const dataView = new DataView(
    new ArrayBuffer(2))
  const idLenBytes = authData.slice(53, 55)
  idLenBytes.forEach(
    (value, index) => dataView.setUint8(index, value)
  )
  return dataView.getUint16(0)
}

export function extractPublicKey (authData: Uint8Array): FIDOPublicKey {
  const credentialIdLength = getCredentialIdLength(authData)
  const credentialId = getCredentialId(authData, credentialIdLength)
  const publicKeyBytes = getPublicKeyBytes(authData, credentialIdLength)
  return {
    publicKey: decodeAllSync(publicKeyBytes)[0],
    credentialId
  }
}
export async function unpackAttestationObject (attestationObject: string): Promise<FIDOAttestation> {
  const attestation = decode(Buffer.from(attestationObject, 'base64'))
  return attestation as FIDOAttestation
}

export async function packAttestationObject (attestation: FIDOAttestation): Promise<string> {
  const encoded = encode(attestation)
  return encoded.toString('base64')
}

export function ASN1toPEM (pkBuffer: Buffer): string {
  if (!Buffer.isBuffer(pkBuffer)) { throw new Error('ASN1toPEM: pkBuffer must be Buffer.') }

  let type
  if (pkBuffer.length === 65 && pkBuffer[0] === 0x04) {
    /*
          If needed, we encode rawpublic key to ASN structure, adding metadata:
          SEQUENCE {
            SEQUENCE {
               OBJECTIDENTIFIER 1.2.840.10045.2.1 (ecPublicKey)
               OBJECTIDENTIFIER 1.2.840.10045.3.1.7 (P-256)
            }
            BITSTRING <raw public key>
          }
          Luckily, to do that, we just need to prefix it with constant 26 bytes (metadata is constant).
      */

    pkBuffer = Buffer.concat([
      Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex'),
      pkBuffer
    ])

    type = 'PUBLIC KEY'
  } else {
    type = 'CERTIFICATE'
  }

  const b64cert = pkBuffer.toString('base64')

  let PEMKey = ''
  for (let i = 0; i < Math.ceil(b64cert.length / 64); i++) {
    const start = 64 * i

    PEMKey += b64cert.substr(start, 64) + '\n'
  }

  PEMKey = `-----BEGIN ${type}-----\n` + PEMKey + `-----END ${type}-----\n`

  return PEMKey
}

/**
 * Takes COSE encoded public key and converts it to RAW PKCS ECDHA key
 * @param  {Buffer} COSEPublicKey - COSE encoded public key
 * @return {Buffer}               - RAW PKCS encoded public key
 */
export function COSEECDHAtoPKCS (COSEPublicKey: Buffer): Buffer {
  /*
     +------+-------+-------+---------+----------------------------------+
     | name | key   | label | type    | description                      |
     |      | type  |       |         |                                  |
     +------+-------+-------+---------+----------------------------------+
     | crv  | 2     | -1    | int /   | EC Curve identifier - Taken from |
     |      |       |       | tstr    | the COSE Curves registry         |
     |      |       |       |         |                                  |
     | x    | 2     | -2    | bstr    | X Coordinate                     |
     |      |       |       |         |                                  |
     | y    | 2     | -3    | bstr /  | Y Coordinate                     |
     |      |       |       | bool    |                                  |
     |      |       |       |         |                                  |
     | d    | 2     | -4    | bstr    | Private key                      |
     +------+-------+-------+---------+----------------------------------+
  */

  const coseStruct = decodeAllSync(COSEPublicKey)[0]
  const tag = Buffer.from([0x04])
  const x = coseStruct.get(-2)
  const y = coseStruct.get(-3)

  return Buffer.concat([tag, x, y])
}

/**
 * Takes signature, data and PEM public key and tries to verify signature
 * @param  {Buffer} signature
 * @param  {Buffer} data
 * @param  {String} publicKey - PEM encoded public key
 * @return {Boolean}
 */
export function verifySignature (signature: Buffer, data: Buffer, publicKey: string): boolean {
  return createVerify('SHA256')
    .update(data)
    .verify(publicKey, signature)
}

export async function validateAttestation (
  attestationObject: string,
  clientDataJSON: string
): Promise<boolean> {
  const attestation = await unpackAttestationObject(attestationObject)
  const { attStmt, authData } = attestation

  const auth = parseRegCredAuthData(Buffer.from(authData))

  // user must be presented!
  if (!(auth.flags & U2F_USER_PRESENTED)) {
    throw new Error('User was NOT presented during authentication!')
  }

  const fidoKey = extractPublicKey(authData)

  // check do we have secp256r1
  if (
    fidoKey.publicKey.get(1) === 2 &&
    fidoKey.publicKey.get(3) === coseALG.ES256 &&
    fidoKey.publicKey.get(-2) &&
    fidoKey.publicKey.get(-3)
  ) {
    const pkcsPublicKey = COSEECDHAtoPKCS(auth.COSEPublicKey)
    const pemCertificate = ASN1toPEM(attStmt.x5c[0])
    const clientDataHash = createHash('sha256').update(clientDataJSON).digest()

    // prepare data to verify
    let signatureBase: Buffer
    if (attestation.fmt === 'fido-u2f') {
      // TODO: get test data from Windows Hello device to cover with tests this part
      const reservedByte = Buffer.from([0x00])
      signatureBase = Buffer.concat([reservedByte, auth.rpIdHash, clientDataHash, auth.credID, pkcsPublicKey])
    } else if (attestation.fmt === 'packed') {
      signatureBase = Buffer.concat([authData, clientDataHash])
    } else {
      throw new Error(`attestation format '${attestation.fmt}' not supported`)
    }
    // make verification using SHA256
    return Promise.resolve(verifySignature(attStmt.sig, signatureBase, pemCertificate))
  } else {
    throw new Error('signing algorithm not supported')
  }
}

export async function validate (
  credential: tpAPI.Schemas.FIDOPublicKeyCredential
): Promise<boolean> {
  const { response, type } = credential
  const { clientDataJSON, attestationObject } = response
  const clientData = JSON.parse(clientDataJSON)

  // MVP input validation

  // we want to only validate the case when we receive the public-key
  if (type !== 'public-key') {
    throw new Error('type must be public-key')
  }

  // clientData must have challenge
  if (!(typeof clientData.challenge === 'string' && clientData.challenge.length > 0)) {
    throw new Error('clientData.challenge must be nonempty string')
  }

  return validateAttestation(attestationObject, clientDataJSON)
}
