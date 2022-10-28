import * as cbor from 'cbor'
import parseAuthData from './parseAuthData';
import { createHash } from 'crypto';
import verifyAttStmt from './verifyAttStmt';

type Attestation = {
  fmt: string
  attStmt: Map<string, string>
  authData: Buffer
}

type RegistrationData = {
  credentialID: string
  publicKeyBytes: Buffer
}

/**
 * Validates a WebAuthn registration attestation
 * @param clientData Client data sent from the client
 * @param attestation Authenticator attestation sent from the client
 * @param expectedChallenge Challenge provided to client to validate against
 * @param expectedOrigins Accepted origins
 * @param expectedRPIDs Expected RP ID
 * @throws {Error} If validation of the registration wasn't successful.
 *                 Use {@link Error.message} to retrieve the reason why validation failed.
 */
const validateRegistration = async (
  clientData: Buffer,
  attestation: string,
  expectedChallenge: string,
  expectedOrigins: string[],
  expectedRPIDs: string[]
): Promise<RegistrationData> => {
  // ====== Validate client data ====== //
  const { challenge, origin, type } = JSON.parse(clientData.toString('utf8'));
  // Ensure all fields are present
  if (!challenge || !origin || !type) throw new Error('Missing expected fields in client data object')
  // For some reason the challenge appears to be encoded again in base64, so we decode it here
  if (Buffer.from(challenge, 'base64').toString('utf8') !== expectedChallenge)
    throw new Error(`Invalid challenge, got ${challenge} instead of ${expectedChallenge}`)
  if (!expectedOrigins.includes(origin)) throw new Error(
    `Unexpected origin "${origin}, expected one of [${expectedOrigins.join(', ')}]`
  )
  if (type !== 'webauthn.create') throw new Error(
    `Unexpected operation type "${type}", expected "webauthn.create"`
  )

  // ====== Validate attestation obj ====== //
  const decoded = await cbor.decodeFirst(attestation, { encoding: 'base64' })
  const {
    fmt,
    attStmt,
    authData
  } = decoded as Attestation
  // Ensure all attestation fields are present
  if (!fmt || !attStmt || !authData) throw new Error('Missing expected fields in attestation object')

  // ====== Validate auth data ====== //
  const
    { attestedCredentialData, rpIDHash, flags, useCount } = await parseAuthData(authData)
  console.log(attestedCredentialData, rpIDHash, flags, useCount)
  if (!attestedCredentialData) throw new Error(
    'Attested credentials data unexpectedly missing from registration authentication data'
  );

  // Validate integrity of content JSON and pub key
  const { credentialID, credentialPubKey } = attestedCredentialData
  const clientDataHash = createHash('sha256').update(clientData).digest()
  await verifyAttStmt(fmt, attStmt, Buffer.concat([authData, clientDataHash]), credentialPubKey)

  // Verify RP ID
  const rpIDValid = expectedRPIDs.some(rpID =>
    rpIDHash === createHash('sha256').update(rpID).digest('base64')
  )
  if (!rpIDValid) throw new Error(
    `Unexpected RP ID hash "${rpIDHash}", expected hashes of one of [${expectedRPIDs.join(', ')}]`
  )

  return {
    credentialID: credentialID,
    publicKeyBytes: credentialPubKey
  }
}

export default validateRegistration