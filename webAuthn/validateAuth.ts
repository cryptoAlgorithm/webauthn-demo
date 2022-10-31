import verifyRPIDHash from './util/verifyRPIDHash';
import parseAuthData from './parseAuthData';
import { AuthenticatorDataFlags } from './types/AuthenticatorData';
import { verify } from 'crypto';
import importCOSE from './util/importCOSE';
import sha256Hash from './util/sha256Hash';
import createLogger from '../utils/createLogger';

const logger = createLogger('validateAuth')

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
  logger.trace('Step 8 - Decoded client data JSON to string')
  // Step 9 - Parse JSONText
  const { type, challenge, origin } = JSON.parse(JSONText)
  logger.trace('Step 9 - Parsed client data JSON to an object')
  // Step 10 - Verify that the value of C.type is the string webauthn.get
  if (type !== 'webauthn.get') throw new Error(`Unexpected type "${type}", expected "webauthn.get"`)
  logger.trace('Step 10 - Operation type is webauthn.get')
  // Step 11 - Verify that the value of C.challenge equals the base64url encoding of options.challenge
  if (challenge !== Buffer.from(expectedChallenge).toString('base64url')) throw new Error(
    `Invalid challenge "${challenge}", expected "${expectedChallenge}"`
  )
  logger.trace('Step 11 - Challenge is valid')
  // Step 12 - Verify that the value of C.origin matches the Relying Party's origin
  if (!expectedOrigins.includes(origin)) throw new Error(
    `Unexpected origin "${origin}", expected one of [${expectedOrigins.join(', ')}]`
  )
  logger.trace('Step 12 - Origin is allowed')

  // Parse authData, will not contain a public key
  const { rpIDHash, flags, useCount } = await parseAuthData(authData)

  // Step 13 - Verify that the rpIdHash in authData is the SHA-256 hash of the
  // RP ID expected by the Relying Party.
  if (!verifyRPIDHash(rpIDHash, expectedRPIDs)) throw new Error(
    `Unexpected RP ID hash "${rpIDHash}", allowed RP IDs: [${expectedRPIDs.join(', ')}]`
  )
  logger.trace('Step 13 - RP ID hash corresponds to one of the allowed RP IDs')

  // Step 14 - Verify that the UP bit of the flags in authData is set.
  if (!(flags & AuthenticatorDataFlags.userPresent)) throw new Error('UP flag bit not set')
  logger.trace('Step 14 - UP bit of flags is set')
  // Step 15 - If the Relying Party requires user verification for this assertion,
  // verify that the UV bit of the flags in authData is set.
  if (userVerificationRequired && !(flags & AuthenticatorDataFlags.userVerified)) throw new Error(
    'User verification required but UV flag not set'
  )
  logger.trace('Step 15 - UV flag state: %s', flags & AuthenticatorDataFlags.userVerified)

  // Step 16 - Ignored as we don't care about credential backup
  // Step 17 - Ignored as extensions aren't in use

  // Step 18 - Compute a hash over the cData using SHA-256.
  const contentHash = sha256Hash(clientData)
  logger.trace(
    { hash: contentHash.toString('base64') },
    'Step 18 - Computed SHA256 hash of client data string'
  )

  // Step 19 - Using credentialRecord.publicKey, verify that sig is a valid signature
  // over the binary concatenation of authData and hash.
  const pem = await importCOSE(verifySigPubKey)
  logger.trace({ pem: pem.substring(0, 50) }, 'Imported COSE as PEM')
  if (!verify(
    'sha256',
    Buffer.concat([authData, contentHash]),
    pem,
    sig
  )) throw new Error('Signature verification failed')
  logger.trace('Step 19 - Verified that sig is a valid signature over the concatenation of authData and hash')

  // Step 20 - Verify signature counter
  // Authenticator may be cloned, to be safe, fail auth ceremonies with an invalid sig counter
  if ((useCount !== 0 || storedSignCount !== 0) && useCount <= storedSignCount) throw new Error(
    `Invalid signature counter ${useCount}, expected > ${storedSignCount}`
  )
  logger.trace({ sigCount: useCount }, 'Step 20 - Signature counter is valid')

  // Step 21 - Ignored as response.attestationObject doesn't seem to exist in any
  // WebAuthn provider during testing (and this step isn't strictly required in the spec)

  return {
    signCount: useCount,
    backupState: !!(flags && AuthenticatorDataFlags.backupState)
  }
}

export default validateAuth