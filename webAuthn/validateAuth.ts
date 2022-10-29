import verifyRPIDHash from './util/verifyRPIDHash';
import parseAuthData from './parseAuthData';
import { AuthenticatorDataFlags } from './types/AuthenticatorData';
import { verify } from 'crypto';
import importCOSE from './util/importCOSE';
import sha256Hash from './util/sha256Hash';

type WebAuthnAuthResult = {
  signCount: number
  backupState: boolean
}

/**
 * Validate an authentication response based on the steps
 * detailed in the [spec](https://w3c.github.io/webauthn/#sctn-verifying-assertion)
 *
 * Validation steps 1 to 5 take place on the client.
 * @param clientData clientData as received from the client
 * @param authData authData as received from the client
 * @param sig Signature of `clientData` and `authData` from WebAuthn auth call as received from the client
 * @param verifySigPubKey Public key to use for signature verification
 * @param storedSignCount Signature counter stored on the server to verify against
 * @param expectedChallenge
 * @param expectedOrigins
 * @param expectedRPIDs
 * @param userVerificationRequired
 */
const validateAuth = async (
  clientData: Buffer,
  authData: Buffer,
  sig: Buffer,
  verifySigPubKey: Buffer,
  storedSignCount: number,
  expectedChallenge: string,
  expectedOrigins: string[],
  expectedRPIDs: string[],
  userVerificationRequired: boolean = true
): Promise<WebAuthnAuthResult> => {
  // Step 8 - Let JSONText be the result of running UTF-8 decode on the value of cData
  const JSONText = clientData.toString()
  // Step 9 - Parse JSONText
  const { type, challenge, origin } = JSON.parse(JSONText)
  // Step 10 - Verify that the value of C.type is the string webauthn.get
  if (type !== 'webauthn.get') throw new Error(`Unexpected type "${type}", expected "webauthn.get"`)
  // Step 11 - Verify that the value of C.challenge equals the base64url encoding of options.challenge
  if (challenge !== Buffer.from(expectedChallenge).toString('base64url')) throw new Error(
    'Invalid challenge'
  )
  // Step 12 - Verify that the value of C.origin matches the Relying Party's origin
  if (!expectedOrigins.includes(origin)) throw new Error(
    `Unexpected origin "${origin}", expected one of [${expectedOrigins.join(', ')}]`
  )

  // Parse authData, will not contain a public key
  const { rpIDHash, flags, useCount } = await parseAuthData(authData)

  // Step 13 - Verify that the rpIdHash in authData is the SHA-256 hash of the
  // RP ID expected by the Relying Party.
  if (!verifyRPIDHash(rpIDHash, expectedRPIDs)) throw new Error(
    `Unexpected RP ID hash "${rpIDHash}", allowed RP IDs: [${expectedRPIDs.join(', ')}]`
  )

  // Step 14 - Verify that the UP bit of the flags in authData is set.
  if (!(flags & AuthenticatorDataFlags.userPresent)) throw new Error('UP flag bit not set')
  // Step 15 - If the Relying Party requires user verification for this assertion,
  // verify that the UV bit of the flags in authData is set.
  if (userVerificationRequired && !(flags & AuthenticatorDataFlags.userVerified)) throw new Error(
    'User verification required but UV flag not set'
  )

  // Step 16 - Ignored as we don't care about credential backup
  // Step 17 - Ignored as extensions aren't in use

  // Step 18 - Compute a hash over the cData using SHA-256.
  const contentHash = sha256Hash(clientData)

  // Step 19 - Using credentialRecord.publicKey, verify that sig is a valid signature
  // over the binary concatenation of authData and hash.
  if (!verify(
    'sha256',
    Buffer.concat([authData, contentHash]),
    await importCOSE(verifySigPubKey),
    sig
  )) throw new Error('Signature verification failed')

  // Step 20 - Verify signature counter
  // Authenticator may be cloned, to be safe, fail auth ceremonies with an invalid sig counter
  if ((useCount !== 0 || storedSignCount !== 0) && useCount <= storedSignCount) throw new Error(
    `Invalid signature counter ${useCount}, expected > ${storedSignCount}`
  )

  // Step 21 - Ignored as response.attestationObject doesn't seem to exist in any
  // WebAuthn provider during testing (and this step isn't strictly required in the spec)

  return {
    signCount: useCount,
    backupState: !!(flags && AuthenticatorDataFlags.backupState)
  }
}

export default validateAuth