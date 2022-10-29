import type { NextApiRequest, NextApiResponse } from 'next'
import firebaseNode from '../../../firebase/firebaseNode';
import { ErrorResponse } from '../ErrorResponse';
import { z } from 'zod';
import { AuthCeremonyBookmark, DBCollections, typeConverter, User } from '../DBTypes';
import routeCatchable from '../../../utils/routeCatchable';
import validateAuth from '../../../webAuthn/validateAuth';

type Data = {
  bearer: string
}

const schema = z.object({
  clientData: z.string(),
  authData: z.string(),
  sig: z.string(),
  credID: z.string(),
  userHandle: z.string(),
  nonce: z.string()
})

const handler = async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  // Only POSTs are allowed here!
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end('Only POST requests are allowed')
    return
  }
  // Validate body with Zod (throws on error)
  // Step 7 - Get response's clientDataJSON, authenticatorData, and signature
  // This is the only step not in order as there is no better place to put it
  const { clientData, authData, sig, userHandle, credID, nonce } = schema.parse(req.body);

  const db = firebaseNode.firestore()
  const authBookmark = await db
    .collection(DBCollections.authCeremonies)
    .withConverter(typeConverter<AuthCeremonyBookmark>())
    .doc(nonce)
    .get()
  if (!authBookmark.data()) {
    res.status(403).json({ error: 'Invalid signup session nonce' })
    return
  }
  const { challenge, expires } = authBookmark.data()!
  // Delete temp session from db
  await authBookmark.ref.delete()

  // Ensure the signup session hasn't expired
  if (expires.toDate() < new Date()) {
    res.status(401).json({ error: 'Signup session expired' })
    return
  }

  // Steps 1 to 6b (i) are carried out by the client and are basically sanity checks

  // Validate registration parameters
  // Step 6b (ii) - Verify that the user account identified by response.userHandle
  // contains a credential record whose id equals credential.rawId
  const userDocRef = db
    .collection(DBCollections.users)
    .doc(userHandle)
  const user = (await userDocRef
    .withConverter(typeConverter<User>())
    .get()
  ).data()
  if (!user || !user.credential.credentialID.equals(Buffer.from(credID, 'base64'))) {
    res.status(404).json({ error: 'No user matches the given credential' })
    return
  }
  const { credential } = user

  try {
    // Steps 7 - 21
    const { signCount, backupState } = await validateAuth(
      Buffer.from(clientData),
      Buffer.from(authData, 'base64'),
      Buffer.from(sig, 'base64'),
      user.credential.publicKeyBytes,
      credential.signCount,
      challenge,
      ['http://localhost:3000', 'https://webauth.vercel.app'],
      ['localhost', 'webauth.vercel.app']
    )
    console.log(credential)

    // Step 22 - Update credentialRecord with new state values
    await userDocRef.update({
      'credential.signCount': signCount,
      'credential.backupState': backupState
    })

    res.status(200).json({ bearer: 'no' })
  } catch (ex: any) {
    res.status(400).json({ error: 'Could not verify WebAuthn authentication' })
    console.log('WebAuthn auth verification failure:', ex.message)
  }
}

export default routeCatchable(handler)