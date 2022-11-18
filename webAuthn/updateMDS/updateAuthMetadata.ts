import {AUTHN_WHITELIST} from "../mds/authWhiteList";
import {MetadataBLOBPayloadEntry} from "../mds/MDSPayload";
import {writeFileSync} from "fs";
import {downloadBlob, blobToJwt} from "../mds/downloadBlob"
import {updateMetadataStatements} from "../mds/updateDB_firebase";
import {promisify} from "util";
import createLogger from "../../utils/createLogger";

const p_downloadBlob = promisify(downloadBlob)
const s_logger = createLogger('update-mds')

export async function updateAuthMetadata(): Promise<number> {
  try {
    // Download MDS blob
    const blobMds = await p_downloadBlob(process.env.MDS_URL, 0)
    s_logger.debug('MDS blob download done')

    // Download CA root cert to verify cert chain of MDS JWT
    const blobCaRootCert = await p_downloadBlob(process.env.MDS_ROOT_CERT_URL, 0)
    s_logger.debug('CA root cert download done')

    // Verify the MDS JWT and get the MDS payload
    const mds = blobToJwt(blobMds, blobCaRootCert)

    let authWlist: MetadataBLOBPayloadEntry[] = []
    if (process.env.MDS_AUTH_WHITELIST && process.env.MDS_AUTH_WHITELIST == 'false') {
      s_logger.warn("Authenticator whitelist is disabled, allow all authenticators in MDS")
      authWlist = mds?.entries ?? []
    } else {
      let aaguidWlist: string[] = []
      let descWlist: string[] = []
      AUTHN_WHITELIST.forEach((value) => {
        aaguidWlist.push(value.aaguid)
        descWlist.push(value.description)
      })

      // Get metadata statement of authenticators in whitelist
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
    }

    if (authWlist.length == 0) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error("Authenticator whitelist is empty")
    }

    //s_logger.debug({count: authWlist.length, authWlist}, 'updateMDS: authenticator whitelist')

    // Write MDS json file, if path is specified
    if (process.env.MDS_JSON_FILEPATH)
      writeFileSync(process.env.MDS_JSON_FILEPATH, JSON.stringify(mds, null, 2), {flag: 'w'})

    // Update whitelist to DB
    const count = await updateMetadataStatements(authWlist)

    s_logger.debug({aaguid: authWlist.map(entry => entry.aaguid)}, "Update MDS success")
    //s_logger.flush()

    return count

  } catch (ex) {
    const err = ex as Error
    s_logger.error({message: err.message, stack: err.stack}, 'Update MDS failed')
    throw ex
  }
}
