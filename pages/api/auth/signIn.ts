import type { NextApiRequest, NextApiResponse } from 'next'
import firebaseNode from '../../../firebase/firebaseNode';
import { ErrorResponse } from '../ErrorResponse';
import * as crypto from 'crypto';
import { AuthCeremonyBookmark, DBCollections, typeConverter } from '../DBTypes';
import { firestore } from 'firebase-admin';
import { deleteTempSessionSchema } from './signUp';
import routeCatchable from '../../../utils/routeCatchable';

type Data = {
  challenge: string
  nonce: string
  timeout: number
}

const WEBAUTHN_AUTH_TIMEOUT = 5*60*1000

const allowedMethods = ['POST', 'DELETE']

const handler = async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  // Only allow POST or DELETE requests
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader('Allow', allowedMethods)
    res.status(405).end(`Allowed methods: ${allowedMethods.join(', ')}`)
    return
  }

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
        .collection(DBCollections.authCeremonies)
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

  // ==============================================================
  // Handle POST requests - create a session for the auth ceremony
  // ==============================================================

  const
    signupNonce = crypto.randomBytes(32).toString('hex'),
    challenge = crypto.randomBytes(32).toString('hex')
  // Persist challenge to a session in db for future reference
  await db
    .collection(DBCollections.authCeremonies)
    .withConverter(typeConverter<AuthCeremonyBookmark>())
    .doc(signupNonce)
    .set({
      challenge: challenge,
      expires: firestore.Timestamp.fromMillis(+new Date() + WEBAUTHN_AUTH_TIMEOUT)
    })

  res.status(200).json({
    challenge: challenge,
    nonce: signupNonce,
    timeout: WEBAUTHN_AUTH_TIMEOUT
  })
}

export default routeCatchable(handler)