import verifyRPIDHash from './util/verifyRPIDHash';
import parseAuthData from './parseAuthData';
import { AuthenticatorDataFlags } from './types/AuthenticatorData';

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
  if (userVerificationRequired && !(flags & AuthenticatorDataFlags.userVerified)) throw new Error(
    'User verification required but UV flag not set'
  )

  // TODO: Steps 15-20

  // Step 21 - Ignored as response.attestationObject doesn't seem to exist in any
  // WebAuthn provider during testing

  return {
    signCount: useCount,
    backupState: !!(flags && AuthenticatorDataFlags.backupState)
  }
}

export default validateAuth