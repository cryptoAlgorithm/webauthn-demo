import {getAttestationRootCerts} from "./updateDB_firebase";
import {X509Certificate} from "crypto";
import createLogger from "../../utils/createLogger";

const s_logger = createLogger('mds')

export async function verifyAttestationTrust(aaguid: string, attCerts: string[]) {
  const attRootCerts = await getAttestationRootCerts(aaguid)

  // Build cert chain
  const attCertChain: X509Certificate[] = []
  attCerts.forEach((der, index) => {
    const cert = new X509Certificate(Buffer.from(der, 'base64'))
    attCertChain.push(cert)
    s_logger.debug({
        subject: cert.subject,
        serialNumber: cert.serialNumber,
        issuer: cert.issuer,
        validFrom: cert.validFrom,
        validTo: cert.validTo
      },
      `verifyAttestation: attestation cert chain (${index})`)
  })
  attRootCerts.forEach((der, index) => {
    const cert = new X509Certificate(Buffer.from(der, 'base64'))
    attCertChain.push(cert)
    s_logger.debug({
        subject: cert.subject,
        serialNumber: cert.serialNumber,
        issuer: cert.issuer,
        validFrom: cert.validFrom,
        validTo: cert.validTo
      },
      `verifyAttestation: attestation root cert chain (${index})`)
  })

  // Verify cert chain
  const curDate = new Date()
  for (let i = 0; i < attCertChain.length - 1; i++) {
    let validFromDate = new Date(attCertChain[i].validFrom)
    let validToDate = new Date(attCertChain[i].validTo)
    if (validFromDate > curDate || validToDate < curDate)
      throw new Error('Cert validity period is invalid')
    if (!attCertChain[i].verify(attCertChain[i + 1].publicKey))
      throw new Error('Cert chain verify error')
  }
  s_logger.debug('verifyAttestation: Cert chain verify ok')
}
