import firebaseNode from "../../firebase/firebaseNode";
import {MetadataBLOBPayloadEntry, StatusReports} from "./MDSPayload";
import {firestore} from "firebase-admin";
import createLogger from "../../utils/createLogger";

// You may add more fields from the metadata statement, do note that
// Firestore does not allow nesting array in an array
export type DBMetadataStatementDoc = {
  description: string
  attestationRootCertificates: string[]
  statusReports: StatusReports[]
  timeOfLastStatusChange: string
  timestamp: firestore.Timestamp
}

enum DBCollections {
  MDS = 'mds'
}

export const typeConverter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
    snap.data() as T
})

const s_db = firebaseNode.firestore()

const s_logger = createLogger('mds-db')

export async function getAttestationRootCerts(aaguid: string) {
  const doc = await s_db
    .collection(DBCollections.MDS)
    .withConverter(typeConverter<DBMetadataStatementDoc>())
    .doc(aaguid)
    .get()

  if (doc.exists) {
    const metaStmt = doc.data()
    if (metaStmt)
      return metaStmt.attestationRootCertificates
  }

  throw new Error(`Metadata statement for ${aaguid} not found`)
}

export async function updateMetadataStatements(newList: MetadataBLOBPayloadEntry[]) {
  s_logger.debug("Update MDS DB...")

  // Set documents in mds collection with new metadata statement values
  for (const entry of newList) {
    if (!entry.aaguid || !entry.metadataStatement)
      continue

    await s_db
      .collection(DBCollections.MDS)
      .withConverter(typeConverter<DBMetadataStatementDoc>())
      .doc(entry.aaguid)
      .set({
        description: entry.metadataStatement.description,
        attestationRootCertificates: entry.metadataStatement.attestationRootCertificates,
        statusReports: entry.statusReports,
        timeOfLastStatusChange: entry.timeOfLastStatusChange,
        timestamp: firestore.FieldValue.serverTimestamp()
      })
  }

  // Delete stale documents (i.e. not in newList), if any
  const deleteDocs = await s_db
    .collection('mds')
    .where(firestore.FieldPath.documentId(), 'not-in', newList.map(entry => entry.aaguid))
    .get()
  // Loop thru every matching document (i.e. not in newList) and delete it.
  for (const doc of deleteDocs.docs)
    await doc.ref.delete();

  s_logger.debug("Update MDS DB success")
}

