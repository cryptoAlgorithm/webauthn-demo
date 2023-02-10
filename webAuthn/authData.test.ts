import {describe, test} from '@jest/globals'
import parseAuthData from "./parseAuthData";
import binaryUUIDToString from "../utils/binaryUUIDToString";
import verifyAttestationStmt from "./verifyAttestationStmt";
import * as cbor from "cbor";

describe('AuthData', () => {
  test('Verify Attestation Stmt', async () => {
    const attestation = Buffer.from('a301667061636b656402589574a6ea9213c99c2f74b22492b320cf40262a94c1a950a0397f29250b60841ef0450000000100000000000000000000000000000000001042763f98b812571227d005b4abf938b7a50102032620012158205da05a6ff12bfc6098c65ff86ca9ed41a50c96ebfda91b2353092e1ca24f3de0225821008ef0ed7bfe58ec6a86ccad14b35d7eddc42007811d0c2631c58d52e79636ad8c03a263616c6726637369675846304402206f2280f6b289c7662ee8b85a74ab925abdb6715be7375860980a46be3ccb8baf022035c8201685cdb0502165eb81026de21222cbc69f3de249430f508af9f4802c37'.replaceAll(' ', ''), 'hex')
    //const decoded = await cbor.decodeFirst(attestation)
    const decoded = await cbor.decodeFirst(attestation)
    // const fmt = decoded.get(1)
    const authData = decoded.get(2)
    const attStmt = decoded.get(3)

    console.log(decoded)
    console.log(authData)

    const {
      attestedCredentialData,
      // rpIDHash,
      flags,
      // useCount
    } = await parseAuthData(authData)
    if (!attestedCredentialData) throw new Error(
      'Attested credentials data unexpectedly missing from registration authentication data'
    );

    console.log(attestedCredentialData)
    console.log(flags)
    //console.log(decoded)

    const clientDataHash = Buffer.from('08d6d44a0dfc1b2c2c558fd902fd5e9638da0a3806a19a16fa946af16bf36de1', 'hex')

    const {
      // credentialID,
      credentialPubKey,
      authenticatorGuid
    } = attestedCredentialData
    await verifyAttestationStmt(
      binaryUUIDToString(authenticatorGuid),
      'packed', attStmt,
      Buffer.concat([authData, clientDataHash]), credentialPubKey
    )
  })
})

