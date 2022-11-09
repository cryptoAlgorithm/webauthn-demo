import https from 'https'
import {promisify} from "util"
import {X509Certificate} from "crypto";

//import {verify} from "jsonwebtoken";

export async function updateMDS(mdsUrl:string, caUrl:string) {
    const p_downloadBlob = promisify(downloadBlob)
    try {
        // Download MDS JWT
        const blobMds = await p_downloadBlob(mdsUrl, 0)
        // Download CA root cert to verify cert chain of MDS JWT
        const blobCaRootCert = await p_downloadBlob(caUrl, 0)
        blobToJwt(blobMds, blobCaRootCert)
    } catch (ex) {
        throw ex
    }
}

/**
 * Downloads a blob file from url over HTTP
 * @param {string} url The url where the file resides
 * @param {function} cb The callback with (err, resp)
 */
function downloadBlob(url: string, redirectCount: number, cb: (err: Error | null, resp: Buffer | null) => void ) {
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
//    const token = buf.toString()

    if (token) {
        const b64sJwt = token.toString().split('.')
        const jwtHdr = JSON.parse(Buffer.from(b64sJwt[0], 'base64').toString())
        const jwtPayload = JSON.parse(Buffer.from(b64sJwt[1], 'base64').toString())
        //const jwtSig = JSON.parse(Buffer.from(b64sJwt[2], 'base64').toString())

        console.log('MDS JWT Header:', jwtHdr)
        if (jwtHdr.x5c) {
            jwtHdr.x5c.forEach((der:string, index: number) => {
                const cert = new X509Certificate(Buffer.from(der, 'base64'))
                console.log(`Cert ${index}:\n-subject: ${cert.subject}\n-serial: ${cert.serialNumber}\n-issuer: ${cert.issuer}\n-validTo: ${cert.validTo}`)
            })
        }
        if (caRootCert) {
            const caCert = new X509Certificate(caRootCert)
            console.log(`CA Root Cert:\n-subject: ${caCert.subject}\n-serial: ${caCert.serialNumber}\n-issuer: ${caCert.issuer}\n-validTo: ${caCert.validTo}`)
        }
        else
            throw new Error('CA root cert not found')
        //console.log('MDS JWT Payload:', jwtPayload)
        //console.log('MDS JWT Sig:', jwtSig)
    }
}
