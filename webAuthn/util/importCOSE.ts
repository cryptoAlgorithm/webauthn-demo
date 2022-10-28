import { decodeFirstSync } from 'cbor';
import { subtle, webcrypto } from 'crypto';

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
enum COSEKty {
  OKP = 1,
  EC2 = 2,
  RSA = 3
}

const jwkToPEM = async (keyData: webcrypto.JsonWebKey): Promise<string> => {
  // First, import the key with WebCrypto in nodeJS in JWK format
  const key = await subtle.importKey(
    'jwk',
    keyData,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['verify']
  )

  // Then export the imported key as a spki key and create an RSA key
  const exp = await subtle.exportKey('spki', key)
  return '-----BEGIN PUBLIC KEY-----\n'
    + Buffer.from(exp).toString('base64')
    + '\n-----END PUBLIC KEY-----'
}

const COSEPublicToPEM = async (k: Buffer): Promise<string> => {
  let decodedCOSE;
  try {
    decodedCOSE = decodeFirstSync(k);
  } catch (err) {
    throw new Error(`Error decoding public key while converting to PEM: ${(err as Error).message}`);
  }

  const kty = decodedCOSE.get(COSEKeys.kty);

  if (!kty) throw new Error('Public key missing kty');

  if (kty === COSEKty.EC2) { // EC2 key
    const
      crv = decodedCOSE.get(COSEKeys.crv),
      x = decodedCOSE.get(COSEKeys.x),
      y = decodedCOSE.get(COSEKeys.y)

    if (!crv) throw new Error('EC2 public key missing crv');
    if (!x || !(x instanceof Buffer)) throw new Error('EC2 public key missing x or invalid format');
    if (!y || !(y instanceof Buffer)) throw new Error('EC2 public key missing y or invalid format');

    return await jwkToPEM({
      kty: 'EC',
      crv: COSECrv[crv],
      x: x.toString('base64'),
      y: y.toString('base64')
    })
  } else if (kty === COSEKty.RSA) {
    const n = decodedCOSE.get(COSEKeys.n);
    const e = decodedCOSE.get(COSEKeys.e);

    if (!n || !(n instanceof Buffer)) throw new Error('RSA public key missing n or invalid format');
    if (!e || !(e instanceof Buffer)) throw new Error('RSA public key missing e or invalid format');

    return await jwkToPEM({
      kty: 'RSA',
      n: n.toString('base64'),
      e: e.toString('base64')
    })
  }
  throw new Error(`Unsupported public key type ${kty}`);
}

const importCOSE = async (k: Buffer): Promise<string> => {
  return COSEPublicToPEM(k)
}

export default importCOSE