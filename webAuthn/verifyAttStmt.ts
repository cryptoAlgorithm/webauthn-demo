import importCOSE from './util/importCOSE';
import * as crypto from 'crypto';

const verifyAttStmt = async (
  format: string,
  attStmt: {[key: string]: any},
  verifyData: Buffer,
  pubKey: Buffer
) => {
  switch (format) {
    case 'packed':
      const { alg, sig } = attStmt
      if (!alg || typeof alg !== 'number') throw new Error('Format is packed but no algo provided')
      if (!sig) throw new Error('Sig is not present or of the wrong type')

      // Verify payload data with given public key
      const isV = crypto.createVerify('sha256').update(verifyData).verify(await importCOSE(pubKey), sig)
      if (!isV) throw new Error('Could not verify authenticity of WebAuthn register payload with included key')
      break
    case 'none':
      console.log('Attestation statement has none type! This is unsafe!')
      break
    default: throw new Error(
      `Unsupported attestation format "${format}", was expecting either "packed" or "none"`
    )
  }
}

export default verifyAttStmt;