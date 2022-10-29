import { createHash } from 'crypto';

/**
 * Simple utility function that hashes given data with SHA-256
 * @param d Buffer of data to hash
 * @return A buffer containing the hash of `d`
 */
const sha256Hash = (d: Buffer): Buffer => createHash('sha256').update(d).digest()

export default sha256Hash