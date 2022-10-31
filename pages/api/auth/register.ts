import type { NextApiRequest, NextApiResponse } from 'next'
import firebaseNode from '../../../firebase/firebaseNode';
import { ErrorResponse } from '../ErrorResponse';
import { z } from 'zod';
import { DBCollections, SignUpSession, typeConverter, User } from '../DBTypes';
import validateRegistration from '../../../webAuthn/validateRegistration';
import routeCatchable from '../../../utils/routeCatchable';
import { AuthedData } from './authenticate';
import authResponse from '../../../auth/authResponse';
import methodGuard from '../../../utils/req/methodGuard';

const schema = z.object({
  clientData: z.string(),
  attestation: z.string(),
  nonce: z.string()
})

const handler = async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthedData | ErrorResponse>
) {
  // Only POSTs are allowed here!
  if (methodGuard(['POST'], req, res)) return
  // Validate body with Zod (throws on error)
  const { clientData, attestation, nonce } = schema.parse(req.body);

  const db = firebaseNode.firestore()
  const signUpSession = await db
    .collection(DBCollections.signUpSessions)
    .withConverter(typeConverter<SignUpSession>())
    .doc(nonce)
    .get()
  if (!signUpSession.data()) {
    res.status(403).json({ error: 'Invalid signup session nonce' })
    return
  }
  const { tempID, challenge, name, email, expires } = signUpSession.data()!
  // Delete temp session from db
  await signUpSession.ref.delete()

  // Ensure the auth ceremony session hasn't expired
  if (expires.toDate() < new Date()) {
    res.status(401).json({ error: 'Signup session expired' })
    return
  }

  // Validate registration parameters
  try {
    const regData = await validateRegistration(
      Buffer.from(clientData),
      attestation,
      challenge,
      ['http://localhost:3000', 'https://webauth.vercel.app'],
      ['localhost', 'webauth.vercel.app']
    )

    // Store required registration data associated with the newly-created user
    await db
      .collection('users')
      .withConverter(typeConverter<User>())
      .doc(tempID)
      .set({
        email: email.trim(),
        name: name.trim(),
        credential: regData
      })

    await authResponse(tempID, res, !req.headers.host?.startsWith('localhost'))
  } catch (ex: any) {
    res.status(400).json({ error: 'Could not verify WebAuthn attestation' })
    console.log('WebAuthn registration verification failure:', ex.message)
  }
}

export default routeCatchable(handler)