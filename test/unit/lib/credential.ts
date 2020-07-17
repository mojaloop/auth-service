/*
 * Manually generated openSSL credentials
 */
const Credential = {
  EC: {
    // Secp256k1 openSSL key pair in pem (base64) format
    keyPair: {
      public: '-----BEGIN PUBLIC KEY-----\n' +
        'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEgAxzw4HxmDWmxJ8dWuzV/DR6+N1diG3U\n' +
        'rPwJWdQbUAvDtQ+mRKPl8lD6WrN6PajHwxyeBE77QyOrOCGWn16xzQ==\n' +
        '-----END PUBLIC KEY-----',
      private: '-----BEGIN EC PRIVATE KEY-----\n' +
        'MHQCAQEEIFFd2lZMG6GtgjrLANA721fVAmgzP4lRZqVFI5OOf/zaoAcGBSuBBAAK\n' +
        'oUQDQgAEgAxzw4HxmDWmxJ8dWuzV/DR6+N1diG3UrPwJWdQbUAvDtQ+mRKPl8lD6\n' +
        'WrN6PajHwxyeBE77QyOrOCGWn16xzQ==\n' +
        '-----END EC PRIVATE KEY-----'
    },
    // Base64 sign digested through SHA256 and signed using private key
    signature: 'MEYCIQC7d3TECMWdWU2bgoUWBv4q6XoOUtRZE5Fgom+seTqT/QIhAK6r3UG+' +
      'xTaSoD9Ef9IfovmPzHqXtuGi5j8oY9IHQq9U',
    // UTF-8 original message
    message: 'Hello I am trying to test this!'
  }
}

export default Credential
