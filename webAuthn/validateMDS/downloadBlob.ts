import https from 'https'
import {promisify} from "util"
import {X509Certificate} from "crypto";
import {AUTHN_WHITELIST} from "./authWhiteList";
//import {verify} from "jsonwebtoken";
import {verify} from "crypto"
import {writeFileSync} from "fs";
import {MDSPayload, MetadataBLOBPayloadEntry} from "./MDSPayload";
import assert from "node:assert";
import {update} from "@firebase/database";
import {getAttestationRootCerts, updateMetadataStatements} from "./DBUpdatesFirebase";

export async function updateMDS() {
    const p_downloadBlob = promisify(downloadBlob)
    try {
        // Download MDS JWT
        const blobMds = await p_downloadBlob(process.env.MDS_URL, 0)
        // Download CA root cert to verify cert chain of MDS JWT
        const blobCaRootCert = await p_downloadBlob(process.env.MDS_ROOT_CERT_URL, 0)
        // Verify the MDS JWT and get the MDS payload
        const mds = blobToJwt(blobMds, blobCaRootCert)

        let aaguidWlist : string[] = []
        let descWlist : string[] = []
        AUTHN_WHITELIST.forEach((value) => {
            aaguidWlist.push(value.aaguid)
            descWlist.push(value.description)
        })

        // Get metadata statement of authenticators in whitelist
        let authWlist: MetadataBLOBPayloadEntry[] = []
        for (const entry of mds?.entries ?? []) {
            const aaguidIndex = (entry.metadataStatement?.aaguid)?
                  aaguidWlist.indexOf(entry.metadataStatement?.aaguid) : -1
            if (aaguidIndex > -1 && entry.metadataStatement?.description === descWlist[aaguidIndex]) {
                aaguidWlist.splice(aaguidIndex, 1)
                descWlist.splice(aaguidIndex, 1)
                authWlist.push(entry)
            }
            if (aaguidWlist.length === 0)
                break
        }
        console.log(`Authenticator whitelist: ${authWlist?.length}\n${JSON.stringify(authWlist, null, 2)}`)

        // Write MDS json file, if path is specified
        if (process.env.MDS_JSON_FILEPATH)
            writeFileSync(process.env.MDS_JSON_FILEPATH, JSON.stringify(mds, null, 2), { flag: 'w'})

        // Update whitelist to DB
        await updateMetadataStatements(authWlist)

    } catch (ex) {
        throw ex
    }
}

export async function verifyAttestation(aaguid: string, attCerts: string[]) {
    if (!aaguid)
        throw new Error("Missing authenticator aaguid")

    const attRootCerts = await getAttestationRootCerts(aaguid)

    // Build cert chain
    const attCertChain : X509Certificate[] = []
    attCerts.forEach((der, index) => {
        const cert = new X509Certificate(Buffer.from(der, 'base64'))
        attCertChain.push(cert)
    })
    attRootCerts.forEach((der, index) => {
        const cert = new X509Certificate(Buffer.from(der, 'base64'))
        attCertChain.push(cert)
    })

    console.log('Root certs of:', aaguid)
    attCertChain.forEach((cert, index) => {
        console.log(`Cert ${index}:\n-subject: ${cert.subject}\n-serial: ${cert.serialNumber}\n-issuer: ${cert.issuer}\n-validTo: ${cert.validTo}`)
    })

    // Verify cert chain
    const curDate = new Date()
    for (let i = 0; i < attCertChain.length - 1; i++) {
        let validFromDate = new Date(attCertChain[i].validFrom)
        let validToDate = new Date(attCertChain[i].validTo)
        if (validFromDate > curDate || validToDate < curDate)
            throw new Error('Cert validity period is invalid')
        if (!attCertChain[i].verify(attCertChain[i+1].publicKey))
            throw new Error('Cert chain verify error')
    }
    console.log('Cert chain verify ok')
}

/**
 * Downloads a blob file from url over HTTP(S)
 * @param {string} url The url where the file resides
 * @param {number} redirectCount The counter keeping track of redirect occurrences
 * @param {function} cb The callback with (err, resp)
 */
function downloadBlob(url: string | undefined, redirectCount: number, cb: (err: Error | null, resp: Buffer | null) => void ) {
    if (url == undefined || url == '')
        throw new Error("URL undefined")
    https.get(url,(response) => {
        const code = response.statusCode ?? 0
        if (code >= 400) {
            cb(new Error(response.statusMessage), null)
            return
        }
        // Handle redirects
        if (code > 300 && code < 400 && !!response.headers.location) {
            console.log('redirecting:', redirectCount, response.headers.location)
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
    } ).on('error', err => {
        cb(err, null)
        return
    })
}

function blobToJwt(token: Buffer | null, caRootCert: Buffer | null) {
    if (token) {
        const b64sJwt = token.toString().split('.')
        const jwtHdr = JSON.parse(Buffer.from(b64sJwt[0], 'base64').toString())
        const jwtPayload = JSON.parse(Buffer.from(b64sJwt[1], 'base64').toString())

        console.log('MDS JWT Header:', jwtHdr)

        const certChain: X509Certificate[] = []
        if (jwtHdr.x5c) {
            jwtHdr.x5c.forEach((der:string, index: number) => {
                const cert = new X509Certificate(Buffer.from(der, 'base64'))
                certChain.push(cert)
                console.log(`Cert ${index}:\n-subject: ${cert.subject}\n-serial: ${cert.serialNumber}\n-issuer: ${cert.issuer}\n-validTo: ${cert.validTo}`)
            })
        }
        if (caRootCert) {
            const caCert = new X509Certificate(caRootCert)
            certChain.push(caCert)
            console.log(`CA Root Cert:\n-subject: ${caCert.subject}\n-serial: ${caCert.serialNumber}\n-issuer: ${caCert.issuer}\n-validTo: ${caCert.validTo}`)
        }
        else
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
        console.log('Cert chain verify ok')

        // Verify cert CN - should match the MDS host
        if (process.env.MDS_HOST == undefined || process.env.MDS_HOST == '')
            throw new Error("MDS host undefined")
        let matchCN = certChain[0].checkHost(process.env.MDS_HOST)
        if (matchCN == undefined )
            throw new Error("MDS cert CN does not match MDS host")
        console.log('Cert CN verify ok:', matchCN)

        // Verify JWT signature
        if ( !verify(null, Buffer.from(b64sJwt[0]+"."+b64sJwt[1]), certChain[0].publicKey, Buffer.from(b64sJwt[2], "base64") )) {
            throw new Error("JWT signature verify error")
        }
        console.log("JWT signature verify ok")

        // Verify JWT signature using jsonwebtoken module.
        //const payload = verify(token.toString(), certChain[0].publicKey.export({format: 'pem', type: 'spki'}))
        //let mds = payload as MDSPayload

        let mds = jwtPayload as MDSPayload
        if ( mds == undefined )
            throw new Error("MDS payload undefined")
        //console.log('MDS JWT Payload:', mds)

        return mds
    }
}
