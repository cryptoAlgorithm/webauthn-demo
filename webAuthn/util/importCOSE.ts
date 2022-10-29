import { decodeFirst } from 'cbor';
import { subtle, webcrypto } from 'crypto';

/*
Constants adapted from https://github.com/MasterKale/SimpleWebAuthn/
 */

enum COSEKeys {
  kty = 1,
  alg = 3,
  crv = -1,
  x = -2,
  y = -3,
  n = -1,
  e = -2,
}
const COSECrv: { [key: number]: string } = {
  // alg: -7
  1: 'P-256',
  // alg: -35
  2: 'P-384',
  // alg: -36
  3: 'P-521',
  // alg: -8
  6: 'ed25519',
}
// noinspection SpellCheckingInspection
const COSERSAParam: { [key: number]: { name: string, hash: string } } = {
  '-3': { name: 'RSA-PSS', hash: '256' },
  '39': { name: 'RSA-PSS', hash: '512' },
  '-38': { name: 'RSA-PSS', hash: '384' },
  '-65535': { name: 'RSASSA-PKCS1-v1_5', hash: '1' },
  '-257': { name: 'RSASSA-PKCS1-v1_5', hash: '256' },
  '-258': { name: 'RSASSA-PKCS1-v1_5', hash: '384' },
  '-259': { name: 'RSASSA-PKCS1-v1_5', hash: '512' }
}
export const COSEAlgHash: { [key: number]: number } = {
  '-65535': 1,
  '-259': 512,
  '-258': 384,
  '-257': 256,
  '-39': 512,
  '-38': 384,
  '-37': 256,
  '-36': 512,
  '-35': 384,
  '-8': 512,
  '-7': 256
};
enum COSEKty {
  OKP = 1,
  EC2 = 2,
  RSA = 3
}

const jwkToPEM = async (
  keyData: webcrypto.JsonWebKey,
  importParams: RsaHashedImportParams | EcKeyImportParams
): Promise<string> => {
  // First, import the key with WebCrypto in nodeJS in JWK format
  const key = await subtle.importKey(
    'jwk',
    keyData,
    importParams,
    true,
    ['verify']
  )

  // Then export the imported key as a spki key and create an RSA key
  const exp = await subtle.exportKey('spki', key)
  return '-----BEGIN PUBLIC KEY-----\n'
    + Buffer.from(exp).toString('base64')
    + '\n-----END PUBLIC KEY-----'
}

const importCOSE = async (k: Buffer): Promise<string> => {
  let decodedCOSE;
  try {
    decodedCOSE = await decodeFirst(k);
  } catch (err) {
    throw new Error(`Error decoding public key while converting to PEM: ${(err as Error).message}`)
  }

  const kty = decodedCOSE.get(COSEKeys.kty)

  if (!kty) throw new Error('Public key missing kty')

  if (kty === COSEKty.EC2) { // EC2 key
    const
      crv = decodedCOSE.get(COSEKeys.crv),
      x = decodedCOSE.get(COSEKeys.x),
      y = decodedCOSE.get(COSEKeys.y)

    if (!crv || typeof crv !== 'number') throw new Error('EC2 public key is missing or has invalid crv')
    if (!x || !(x instanceof Buffer)) throw new Error('EC2 public key is missing or has invalid x')
    if (!y || !(y instanceof Buffer)) throw new Error('EC2 public key is missing or has invalid y')

    if (!(crv in COSECrv)) throw new Error(`Unexpected EC curve ${crv}`)

    return await jwkToPEM({
      kty: 'EC',
      crv: COSECrv[crv],
      x: x.toString('base64'),
      y: y.toString('base64')
    }, {
      name: 'ECDSA',
      namedCurve: COSECrv[crv]
    })
  } else if (kty === COSEKty.RSA) {
    const
      n = decodedCOSE.get(COSEKeys.n),
      e = decodedCOSE.get(COSEKeys.e),
      alg = decodedCOSE.get(COSEKeys.alg)

    if (!n || !(n instanceof Buffer)) throw new Error('RSA public key is missing or has invalid n')
    if (!e || !(e instanceof Buffer)) throw new Error('RSA public key is missing or has invalid e')
    if (!alg || typeof alg !== 'number') throw new Error('RSA public key is missing or has invalid alg')

    if (!(alg in COSERSAParam)) throw new Error(`Unexpected RSA algorithm ${alg}`)

    return await jwkToPEM({
      kty: 'RSA',
      n: n.toString('base64'),
      e: e.toString('base64')
    }, COSERSAParam[alg])
  } else if (kty === COSEKty.OKP) {
    // TODO: Implement Ed25519 importing
  }
  throw new Error(`Unsupported public key type ${kty}`)
}

export default importCOSE