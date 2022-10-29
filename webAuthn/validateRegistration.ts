import * as cbor from 'cbor'
import parseAuthData, { AuthenticatorDataFlags } from './parseAuthData';
import { createHash } from 'crypto';
import verifyAttStmt from './verifyAttStmt';

type Attestation = {
  fmt: string
  attStmt: Map<string, string>
  authData: Buffer
}

type CredentialRecord = {
  credentialID: string
  publicKeyBytes: Buffer,
  signCount: number
}

/**
 * Validates a WebAuthn registration attestation
 *
 * Refer to https://w3c.github.io/webauthn/#sctn-registering-a-new-credential
 * for the registration procedure in the spec.
 * @param clientData Client data sent from the client
 * @param attestation Authenticator attestation sent from the client
 * @param expectedChallenge Challenge provided to client to validate against
 * @param expectedOrigins Accepted origins
 * @param expectedRPIDs Expected RP ID
 * @param userVerifiedRequired If the presence of the UV flag should be enforced
 * @throws {Error} If validation of the registration wasn't successful.
 *                 Use {@link Error.message} to retrieve the reason why validation failed.
 */
const validateRegistration = async (
  clientData: Buffer,
  attestation: string,
  expectedChallenge: string,
  expectedOrigins: string[],
  expectedRPIDs: string[],
  userVerifiedRequired: boolean = true
): Promise<CredentialRecord> => {
  // Registration steps 1-5 carried out at the client

  // ================================== //
  // ====== Validate client data ====== //
  // ================================== //
  // Step 6 - Run implementation-specific JSON parser on JSONText
  const { challenge, origin, type } = JSON.parse(clientData.toString());
  // Ensure all fields are present
  if (!challenge || !origin || !type) throw new Error('Missing expected fields in client data object')
  // Step 7 - Verify that the value of C.type is webauthn.create
  if (type !== 'webauthn.create') throw new Error(
    `Unexpected operation type "${type}", expected "webauthn.create"`
  )
  // Step 8 - Verify that the value of C.challenge equals the base64url encoding of options.challenge
  if (challenge !== Buffer.from(expectedChallenge).toString('base64url'))
    throw new Error(`Invalid challenge, got ${challenge} instead of ${expectedChallenge}`)
  // Step 9 - Verify that the value of C.origin matches the Relying Party's origin.
  if (!expectedOrigins.includes(origin)) throw new Error(
    `Unexpected origin "${origin}, expected one of [${expectedOrigins.join(', ')}]`
  )
  // Step 10 - Compute a hash over response.clientDataJSON using SHA-256.
  const clientDataHash = createHash('sha256').update(clientData).digest()

  // ====================================== //
  // ====== Validate attestation obj ====== //
  // ====================================== //
  // Step 11 - Perform CBOR decoding on the attestationObject field of the
  // AuthenticatorAttestationResponse structure
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
  if (!attestedCredentialData) throw new Error(
    'Attested credentials data unexpectedly missing from registration authentication data'
  );

  const { credentialID, credentialPubKey } = attestedCredentialData

  // Step 12 - Verify that the rpIdHash in authData is the SHA-256 hash of the RP ID
  // expected by the Relying Party.
  const rpIDValid = expectedRPIDs.some(rpID =>
    rpIDHash === createHash('sha256').update(rpID).digest('base64')
  )
  if (!rpIDValid) throw new Error(
    `Unexpected RP ID hash "${rpIDHash}", expected hashes of one of [${expectedRPIDs.join(', ')}]`
  )

  // Step 13 - Verify that the UP bit of the flags in authData is set.
  if (!(flags & AuthenticatorDataFlags.userPresent)) throw new Error('UP flag bit not set')
  // Step 14 - If the Relying Party requires user verification for this registration,
  // verify that the UV bit of the flags in authData is set.
  if (userVerifiedRequired && !(flags & AuthenticatorDataFlags.userVerified)) throw new Error(
    'User verification required but UV flag not set'
  )

  // Steps 17, 19 & 20 - Verify attestation statement
  await verifyAttStmt(fmt, attStmt, Buffer.concat([authData, clientDataHash]), credentialPubKey)

  // Step 23 - Verify that the credentialId is ≤ 1023 bytes
  if (credentialID.byteLength > 1023) throw new Error(
    `Credential ID too long, expected <= 1023B, actual: ${credentialID.byteLength}B`
  )

  return {
    credentialID: credentialID.toString('base64'),
    publicKeyBytes: credentialPubKey,
    signCount: useCount
  }
}

export default validateRegistration