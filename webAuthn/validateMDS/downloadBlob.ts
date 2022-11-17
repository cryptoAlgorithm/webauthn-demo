import https from 'https'
import {promisify} from "util"
import {X509Certificate} from "crypto";
import {AUTHN_WHITELIST} from "./authWhiteList";
//import {verify} from "jsonwebtoken";
import {verify} from "crypto"
import {writeFileSync} from "fs";
import {MDSPayload, MetadataBLOBPayloadEntry} from "./MDSPayload";
import {getAttestationRootCerts, updateMetadataStatements} from "./DBUpdatesFirebase";
import createLogger from "../../utils/createLogger";

const p_downloadBlob = promisify(downloadBlob)
const s_logger = createLogger('mds')

export async function updateMDS() {
  try {
    // Download MDS blob
    const blobMds = await p_downloadBlob(process.env.MDS_URL, 0)
    s_logger.debug('MDS blob download done')

    // Download CA root cert to verify cert chain of MDS JWT
    const blobCaRootCert = await p_downloadBlob(process.env.MDS_ROOT_CERT_URL, 0)
    s_logger.debug('CA root cert download done')

    // Verify the MDS JWT and get the MDS payload
    const mds = blobToJwt(blobMds, blobCaRootCert)

    let aaguidWlist: string[] = []
    let descWlist: string[] = []
    AUTHN_WHITELIST.forEach((value) => {
      aaguidWlist.push(value.aaguid)
      descWlist.push(value.description)
    })

    // Get metadata statement of authenticators in whitelist
    let authWlist: MetadataBLOBPayloadEntry[] = []
    for (const entry of mds?.entries ?? []) {
      const aaguidIndex = (entry.metadataStatement?.aaguid) ?
        aaguidWlist.indexOf(entry.metadataStatement?.aaguid) : -1
      if (aaguidIndex > -1 && entry.metadataStatement?.description === descWlist[aaguidIndex]) {
        aaguidWlist.splice(aaguidIndex, 1)
        descWlist.splice(aaguidIndex, 1)
        authWlist.push(entry)
      }
      if (aaguidWlist.length === 0)
        break
    }

    s_logger.debug({count: authWlist.length, authWlist}, 'updateMDS: authenticator whitelist')

    // Write MDS json file, if path is specified
    if (process.env.MDS_JSON_FILEPATH)
      writeFileSync(process.env.MDS_JSON_FILEPATH, JSON.stringify(mds, null, 2), {flag: 'w'})

    // Update whitelist to DB
    await updateMetadataStatements(authWlist)

    s_logger.debug({aaguid: authWlist.map(entry => entry.aaguid)}, "Update MDS success")
    s_logger.flush()

  } catch (ex) {
    const err = ex as Error
    s_logger.error({message: err.message, stack: err.stack}, 'Update MDS failed')
    throw ex
  }
}

export async function verifyAttestation(aaguid: string, attCerts: string[]) {
  if (!aaguid)
    throw new Error("Missing authenticator aaguid")

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

async function downloadBlob2(url: string | undefined, redirectCount: number): Promise<Buffer> {
  if (url == undefined || url == '')
    throw new Error("URL undefined")

  return await new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const code = response.statusCode ?? 0
      if (code >= 400) {
        reject(new Error(response.statusMessage))
        return
      }
      // Handle redirects
      if (code > 300 && code < 400 && !!response.headers.location) {
        s_logger.debug({redirectCount, redirect: response.headers.location}, 'downloadBlob: redirecting')
        if (redirectCount < 10)
          return downloadBlob2(response.headers.location, redirectCount++)
        else {
          reject(new Error("Too many redirects"))
          return
        }
      }

      let data: Buffer[] = []
      response.on('data', (chunk) => {
        data.push(chunk)
      })
      response.on('end', () => {
        const dataAll = Buffer.concat(data)
        return resolve(dataAll)
      })
      response.on('error', (err) => {
        reject(err)
        return
      })
    }).on('error', err => {
      reject(err)
      return
    })
  })

}

/**
 * Downloads a blob file from url over HTTP(S)
 * @param {string} url The url where the file resides
 * @param {number} redirectCount The counter keeping track of redirect occurrences
 * @param {function} cb The callback with (err, resp)
 */
function downloadBlob(url: string | undefined, redirectCount: number, cb: (err: Error | null, resp: Buffer | null) => void) {
  if (url == undefined || url == '')
    throw new Error("URL undefined")

  https.get(url, (response) => {
    const code = response.statusCode ?? 0
    if (code >= 400) {
      cb(new Error(response.statusMessage), null)
      return
    }
    // Handle redirects
    if (code > 300 && code < 400 && !!response.headers.location) {
      s_logger.debug({redirectCount, redirect: response.headers.location}, 'downloadBlob: redirecting')
      if (redirectCount < 10)
        return downloadBlob(response.headers.location, redirectCount++, cb)
      else {
        cb(new Error("Too many redirects"), null)
        return
      }
    }

    let data: Buffer[] = []
    response.on('data', (chunk) => {
      data.push(chunk)
    })
    response.on('end', () => {
      const dataAll = Buffer.concat(data)
      cb(null, dataAll)
      return
    })
    response.on('error', (err) => {
      cb(err, null)
      return
    })
  }).on('error', err => {
    cb(err, null)
    return
  })
}

function blobToJwt(token: Buffer | null, caRootCert: Buffer | null) {
  if (token) {
    const b64sJwt = token.toString().split('.')
    const jwtHdr = JSON.parse(Buffer.from(b64sJwt[0], 'base64').toString())
    const jwtPayload = JSON.parse(Buffer.from(b64sJwt[1], 'base64').toString())

    s_logger.debug({jwtHdr}, 'blobToJwt: MDS JWT header')

    const certChain: X509Certificate[] = []
    if (jwtHdr.x5c) {
      jwtHdr.x5c.forEach((der: string, index: number) => {
        const cert = new X509Certificate(Buffer.from(der, 'base64'))
        certChain.push(cert)
        s_logger.debug({
            subject: cert.subject,
            serialNumber: cert.serialNumber,
            issuer: cert.issuer,
            validFrom: cert.validFrom,
            validTo: cert.validTo
          },
          `blobToJwt: x5c cert chain (${index})`)
      })
    }
    if (caRootCert) {
      const caCert = new X509Certificate(caRootCert)
      certChain.push(caCert)
      s_logger.debug({
          subject: caCert.subject,
          serialNumber: caCert.serialNumber,
          issuer: caCert.issuer,
          validFrom: caCert.validFrom,
          validTo: caCert.validTo
        },
        "blobToJwt: CA root cert")
    } else
      throw new Error('CA root cert not found')

    // Verify cert chain
    const curDate = new Date()
    for (let i = 0; i < certChain.length - 1; i++) {
      let validFromDate = new Date(certChain[i].validFrom)
      let validToDate = new Date(certChain[i].validTo)
      if (validFromDate > curDate || validToDate < curDate)
        throw new Error('Cert validity period is invalid')
      if (!certChain[i].verify(certChain[i + 1].publicKey))
        throw new Error('Cert chain verify error')
    }
    s_logger.debug("blobToJwt: Cert chain verify ok")

    // Verify cert CN - should match the MDS host
    if (process.env.MDS_HOST == undefined || process.env.MDS_HOST == '')
      throw new Error("MDS host undefined")
    let matchCN = certChain[0].checkHost(process.env.MDS_HOST)
    if (matchCN == undefined)
      throw new Error("MDS cert CN does not match MDS host")
    s_logger.debug({matchCN}, "blobToJwt: Cert CN verify ok")

    // Verify JWT signature
    if (!verify(null,
      Buffer.from(b64sJwt[0] + "." + b64sJwt[1]),
      certChain[0].publicKey,
      Buffer.from(b64sJwt[2], "base64"))) {
      throw new Error("JWT signature verify error")
    }
    s_logger.debug("JWT signature verify ok")

    // Verify JWT signature using jsonwebtoken module.
    //const payload = verify(token.toString(), certChain[0].publicKey.export({format: 'pem', type: 'spki'}))
    //let mds = payload as MDSPayload

    let mds = jwtPayload as MDSPayload
    if (mds == undefined)
      throw new Error("MDS payload undefined")

    return mds
  }
}
