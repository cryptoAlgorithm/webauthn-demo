import https from 'https'
import {promisify} from "util"
import {X509Certificate} from "crypto";

//import {verify} from "jsonwebtoken";

export async function updateMDS(mdsUrl:string, caUrl:string) {
    const p_downloadBlob = promisify(downloadBlob)
    try {
        const blobMds = await p_downloadBlob(mdsUrl, 0)
        const blobCaCert = await p_downloadBlob(caUrl, 0)
        const caPem = blobToCaCert(blobCaCert)
        blobToJwt(blobMds, caPem)
    } catch (ex) {
        throw ex
    }
}

/**
 * Downloads a blob file from url over HTTP
 * @param {string} url The url where the file resides
 * @param {function} cb The callback with (err, resp)
 */
function downloadBlob(url: string, redirectCount: number, cb: (err: Error | null, resp: string | null) => void ) {
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

        let data: string = ''
        response.on('data', (chunk) => {
            data += chunk
        })
        response.on('end', () => {
            cb(null, data)
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

function blobToCaCert(blob:string | null) : string {
    if (blob) {
        const data = blob.split('-----BEGIN CERTIFICATE-----')
        if (data[1])
            return '-----BEGIN CERTIFICATE-----' + data[1]
    }
    throw new Error('CA root cert not found')
}

function blobToJwt(token: string | null, caPem: string) {
//    const token = buf.toString()

    if ( token != null ) {
        const b64sJwt = token.split('.')
        const jwtHdr = JSON.parse(Buffer.from(b64sJwt[0], 'base64').toString())
        const jwtPayload = JSON.parse(Buffer.from(b64sJwt[1], 'base64').toString())
        //const jwtSig = JSON.parse(Buffer.from(b64sJwt[2], 'base64').toString())

        console.log('MDS JWT Header:', jwtHdr)
        if (jwtHdr.x5c) {
            jwtHdr.x5c.forEach((der:string, index: number) => {
                const cert = new X509Certificate(Buffer.from(der, 'base64'))
                console.log(`Cert: ${index}\n-subject: ${cert.subject}\n-serial: ${cert.serialNumber}\n-issuer: ${cert.issuer}\n-validTo: ${cert.validTo}`)
            })
        }
        const caCert = new X509Certificate(caPem)
        console.log(`CA Cert:\n-subject: ${caCert.subject}\n-serial: ${caCert.serialNumber}\n-issuer: ${caCert.issuer}\n-validTo: ${caCert.validTo}`)

        //console.log('MDS JWT Payload:', jwtPayload)
        //console.log('MDS JWT Sig:', jwtSig)
    }
}
