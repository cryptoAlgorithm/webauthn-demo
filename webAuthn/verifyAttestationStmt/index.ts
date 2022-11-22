import validatePacked from './validatePacked';

const verifyAttestationStmt = async (
  aaGuid: string,
  format: string,
  attStmt: {[key: string]: any},
  verifyData: Buffer,
  pubKey: Buffer
) => {
  // Step 19 - Determine the attestation statement format by performing a US ASCII case-sensitive match on fmt
  switch (format) {
    case 'packed':
      await validatePacked(aaGuid, attStmt, verifyData, pubKey)
      break
    case 'none':
      console.warn('Attestation statement has none type! This is unsafe!')
      break
    default: throw new Error(
      `Unsupported attestation format "${format}", was expecting either "packed" or "none"`
    )
  }
}

export default verifyAttestationStmt;