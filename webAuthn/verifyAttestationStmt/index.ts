import validatePacked from './validatePacked';

const verifyAttestationStmt = async (
  format: string,
  attStmt: {[key: string]: any},
  verifyData: Buffer,
  pubKey: Buffer
) => {
  switch (format) {
    case 'packed':
      await validatePacked(attStmt, verifyData, pubKey)
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