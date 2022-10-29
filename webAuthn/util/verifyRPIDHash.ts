import sha256Hash from './sha256Hash';

/**
 * Ascertains that the RP ID hash corresponds to one of the hashes of accepted RP IDs
 * @param RPIDHash RP ID hash to verify
 * @param acceptedRPIDs Accepted RP IDs (not their hashes!)
 */
const verifyRPIDHash = (RPIDHash: string, acceptedRPIDs: string[]): boolean => acceptedRPIDs.some(rpID =>
  RPIDHash === sha256Hash(Buffer.from(rpID)).toString('base64')
)

export default verifyRPIDHash