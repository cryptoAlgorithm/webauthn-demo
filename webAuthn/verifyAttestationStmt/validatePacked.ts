import { verify, X509Certificate } from 'crypto';
import importCOSE, { COSEAlgHash } from '../util/importCOSE';
import {verifyAttestationTrust} from "../mds/verifyAttestationTrust";

/**
 * Validate an attestation statement of type "packed"
 * @param aaGuid The authenticator's guild
 * @param attStmt The attestation statement
 * @param verifyData The data to verify
 * @param pubKey The public key
 */
const validatePacked = async (
  aaGuid: string,
  attStmt: {[key: string]: any},
  verifyData: Buffer,
  pubKey: Buffer
) => {
  const { alg, sig, x5c } = attStmt
  if (!alg || typeof alg !== 'number') throw new Error('Format is packed but no algo provided')
  if (!sig || !(sig instanceof Buffer)) throw new Error('Sig is not present or of the wrong type')

  if (!(alg in COSEAlgHash)) throw new Error(`Unknown COSE hash algorithm ${alg}`)
  const hashAlg = 'sha' + COSEAlgHash[alg]

  if (x5c) {
    if (!Array.isArray(x5c) || x5c.length === 0) throw new Error('x5c present but is invalid or has no certs')

    // Verify that the cert chain is one that we trust
    await verifyAttestationTrust(aaGuid, x5c)

    const cert = new X509Certificate(x5c[0])

    // Verify X.509 attestation statement cert meets requirements
    const subjects: {[subject: string]: string} = cert
      .subject
      .split('\n')
      .reduce((o, s) => {
        const ss = s.split('=')
        if (ss.length !== 2) throw new Error('Failed to parse X.509 subject')
        return { ...o, [ss[0]]: ss[1] }
      }, {})
    const { OU, CN, O, C } = subjects
    if (OU !== 'Authenticator Attestation') throw new Error('X.509 cert subject OU not "Authenticator Attestation"')
    if (!CN) throw new Error('X.509 cert subject missing CN')
    if (!O) throw new Error('X.509 cert subject missing O')
    if (!C) throw new Error('X.509 cert subject missing C')
    if (cert.ca) throw new Error('X.509 cert is a CA cert, which is not allowed')
    // Ensure cert is (still) valid now
    if (new Date(cert.validFrom) > new Date()) throw new Error(`X.509 cert not valid before ${cert.validFrom}`)
    if (new Date(cert.validTo) < new Date()) throw new Error(`X.509 cert not valid after ${cert.validTo}`)
    // TODO: find out how to access and validate cert extensions

    // Verify that sig is a valid signature
    const v = verify(hashAlg, verifyData, cert.toString(), sig)
    if (!v) throw new Error('Could not verify authenticity of payload with X.509 cert')
    // throw new Error('in development')
  } else {
    console.warn('Self attestation in use')

    // Verify payload data with given public key
    const pubKeyPEM = await importCOSE(pubKey)

    const isV = verify(hashAlg, verifyData, pubKeyPEM, sig)
    if (!isV) throw new Error('Could not verify authenticity of payload with self-attestation key')
  }
}

export default validatePacked