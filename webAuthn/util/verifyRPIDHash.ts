import { createHash } from 'crypto';

/**
 * Ascertains that the RP ID hash corresponds to one of the hashes of accepted RP IDs
 * @param RPIDHash RP ID hash to verify
 * @param acceptedRPIDs Accepted RP IDs (not their hashes!)
 */
const verifyRPIDHash = (RPIDHash: string, acceptedRPIDs: string[]): boolean => acceptedRPIDs.some(rpID =>
  RPIDHash === createHash('sha256').update(rpID).digest('base64')
)

export default verifyRPIDHash