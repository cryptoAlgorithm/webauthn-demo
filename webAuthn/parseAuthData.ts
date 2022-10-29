import { decodeFirst, decodeFirstSync, encode } from 'cbor';
import { AuthenticatorData, AuthenticatorDataFlags } from './types/AuthenticatorData';

/**
 * Parse the encoded attestation data into usable data
 *
 * Based on https://w3c.github.io/webauthn/#attestation-object
 * @param bytes Buffer of encoded attestation data
 * @return An object representing various pieces of data in of the attestation data
 * @throws {Error} If the attestation data was invalid
 */
const parseAuthData = async (bytes: Buffer): Promise<AuthenticatorData> => {
  /*
    Don't bother parsing if there aren't enough bytes for at least:
     - rpIdHash (32 bytes)
     - flags (1 byte)
     - signCount (4 bytes)
   */
  if (bytes.byteLength < 37) throw new Error(
    `Received ${bytes.length} bytes but at least 37 are required to parse auth data`
  )

  let pt = 0; // Decoding pointer

  const rpIdHash = bytes.subarray(pt, (pt += 32)).toString('base64');

  const flags = bytes.subarray(pt, (pt += 1))[0];

  const counter = bytes.subarray(pt, (pt += 4)).readUInt32BE();

  let authData: AuthenticatorData = {
    rpIDHash: rpIdHash,
    flags: flags,
    useCount: counter
  }

  if (flags & AuthenticatorDataFlags.attestedCredIncluded) {
    const aGuid = bytes.subarray(pt, (pt += 16));

    const credIDLen = bytes.subarray(pt, (pt += 2)).readUInt16BE();
    const credentialID = bytes.subarray(pt, (pt += credIDLen));

    // Credential public key encoded in CBOR!
    // Decode the next CBOR item in the buffer, then re-encode it back to a Buffer to find the length of the CBOR-encoded public key
    const firstDecoded = decodeFirstSync(bytes.subarray(pt));
    const firstEncoded = Buffer.from(encode(firstDecoded) as ArrayBuffer);
    pt += firstEncoded.byteLength;

    authData.attestedCredentialData = {
      authenticatorGuid: aGuid,
      credentialID: credentialID,
      credentialPubKey: firstEncoded
    }
  }

  // Extensions: to be implemented if and when extensions are useful
  if (flags & AuthenticatorDataFlags.extensionDataIncluded) {
    const firstDecoded = decodeFirst(bytes.subarray(pt));
    const firstEncoded = Buffer.from(encode(firstDecoded) as ArrayBuffer);
   // extensionsData = decodeAuthenticatorExtensions(extensionsDataBuffer);
    pt += firstEncoded.byteLength;
  }

  // Pointer should be at the end of the authenticator data, otherwise too much data was sent
  if (bytes.byteLength > pt) throw new Error('Erroneous bytes present after decoding complete');

  return authData
}

export default parseAuthData