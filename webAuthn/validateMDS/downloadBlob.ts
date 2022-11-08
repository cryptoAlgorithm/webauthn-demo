import https from 'https'
import {promisify} from "util"

//import {verify} from "jsonwebtoken";

export async function updateMDS(url:string) {
    const dn = promisify(downloadBlob)
    try {
        const blob = await dn(url)
        blobToJwt(blob)
    } catch (ex) {
        throw ex
    }
}

/**
 * Downloads a blob file from url over HTTP
 * @param {string} url The url where the file resides
 * @param {function} cb The callback with (err, resp)
 */
function downloadBlob(url: string, cb: (err: Error | null, resp: string | null) => void ) {
    https.get(url,(response) => {
        const code = response.statusCode ?? 0
        if ( code >= 400 ) {
            cb(new Error(response.statusMessage), null)
            return
        }
        // Handle redirects
        if ( code > 300 && code < 400 && !!response.headers.location ) {
            return downloadBlob(response.headers.location, cb)
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

function blobToJwt(token: string | null) {
//    const token = buf.toString()

    if ( token != null ) {
        const b64sJwt = token.split('.')
        const jwtHdr = JSON.parse(Buffer.from(b64sJwt[0], 'base64').toString())
        const jwtPayload = JSON.parse(Buffer.from(b64sJwt[1], 'base64').toString())
        //const jwtSig = JSON.parse(Buffer.from(b64sJwt[2], 'base64').toString())

        console.log('MDS JWT Header:', jwtHdr)
        //console.log('MDS JWT Payload:', jwtPayload)
        //console.log('MDS JWT Sig:', jwtSig)
    }
}
