import type { NextApiRequest, NextApiResponse } from 'next'
import firebaseNode from '../../../firebase/firebaseNode';
import { ErrorResponse } from '../ErrorResponse';
import { z } from 'zod';
import * as crypto from 'crypto';
import { DBCollections, SignUpSession, typeConverter, User } from '../DBTypes';
import { firestore } from 'firebase-admin';
import routeCatchable from '../../../utils/routeCatchable';
import methodGuard from '../../../utils/req/methodGuard';

type Data = {
  challenge: string
  nonce: string
  id: string
  timeout: number
  uv: boolean
}

const schema = z.object({
  email: z.string().email(),
  name: z.string()
})
export const deleteTempSessionSchema = z.object({
  nonce: z.string()
})

const WEBAUTHN_TIMEOUT = 5*60*1000
export const WEBAUTHN_UV_REQUIRED = !!process.env.WEBAUTHN_UV_REQUIRED

const handler = async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  // Only allow POST or DELETE requests
  if (methodGuard(['POST', 'DELETE'], req, res)) return

  // Get reference to Firestore
  const db = firebaseNode.firestore()

  // =====================================================================
  // Handle DELETE requests - remove the temp signup session
  // For cancelling existing sessions if the WebAuthn flow is interrupted
  // =====================================================================
  if (req.method === 'DELETE') {
    const { nonce } = deleteTempSessionSchema.parse(req.body)
    try {
      await db
        .collection('signUpSessions')
        .doc(nonce)
        .delete({ exists: true })
    } catch (ex: any) {
      // Probably because the doc doesn't exist
      if (ex?.code === 5) res.status(404).json({ error: 'Invalid nonce' })
      else res.status(400).json({ error: 'Failed to delete session' })
      return
    }
    res.status(204).end()
    return
  }

  // ========================================================================
  // Handle POST requests - create a temp signup session at the start of the
  // WebAuthn registration ceremony
  // ========================================================================

  // Validate body with Zod (throws on error)
  const { email, name } = schema.parse(req.body);
  const pureEmail = email.trim().toLowerCase()

  // Check if user with the same email already exists in the db
  const existingUsers = await db
    .collection('users')
    .withConverter(typeConverter<User>())
    .where('email', '==', pureEmail)
    .count()
    .get()
  if (existingUsers.data().count !== 0) {
    res.status(403).json({ error: 'User already exists' })
    return
  }

  const
    signupNonce = crypto.randomBytes(32).toString('hex'),
    challenge = crypto.randomBytes(32).toString('hex'),
    id = crypto.randomUUID()
  // "Cache" signup session in database
  await db
    .collection(DBCollections.signUpSessions)
    .withConverter(typeConverter<SignUpSession>())
    .doc(signupNonce)
    .set({
      challenge: challenge,
      name: name,
      email: pureEmail,
      tempID: id,
      expires: firestore.Timestamp.fromMillis(+new Date() + WEBAUTHN_TIMEOUT)
    })

  res.status(200).json({
    challenge: challenge,
    nonce: signupNonce,
    id: id,
    timeout: WEBAUTHN_TIMEOUT,
    uv: WEBAUTHN_UV_REQUIRED
  })
}

export default routeCatchable(handler)