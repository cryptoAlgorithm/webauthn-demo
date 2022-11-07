import https from 'https'
import {verify} from "jsonwebtoken";

/**
 * Downloads a blob file from url over HTTP
 * @param {string} url The url where the file resides
 * @return { Promise<Buffer> } The buffer containing the file
 */
async function downloadBlob(url: string): Promise<Buffer> {
    return await new Promise((resolve, reject) => {
        https.get(url,(response) => {
            const code = response.statusCode ?? 0
            if ( code >= 400 ) {
                return reject(new Error(response.statusMessage))
            }
            // Handle redirects
            if ( code > 300 && code < 400 && !!response.headers.location ) {
                return downloadBlob(response.headers.location)
            }

            let data: any[] = []
            response.on('data', (chunk: any) => {
                data += chunk
            })
            response.on('end', () => {
                resolve(Buffer.concat(data))
            })
            response.on('error', (err) => {
                reject(err)
            })
        } ).on('error', error => {
            reject(error)
        })
    })
}

function blobToJwt(buf: Buffer) {
    const token = buf.toString()
    const b64sJwt = token.split('.')
    const jwtHdr = JSON.parse(Buffer.from(b64sJwt[0], 'base64').toString())
    const jwtPayload = JSON.parse(Buffer.from(b64sJwt[1], 'base64').toString())
    const jwtSig = JSON.parse(Buffer.from(b64sJwt[2], 'base64').toString())

    console.log('MDS JWT Header:', jwtHdr)
    console.log('MDS JWT Payload:', jwtPayload)
    console.log('MDS JWT Sig:', jwtSig)
}
