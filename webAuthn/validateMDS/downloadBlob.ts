import https from 'https'

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

