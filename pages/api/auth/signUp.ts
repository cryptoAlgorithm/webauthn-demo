import type { NextApiRequest, NextApiResponse } from 'next'
import firebaseNode from '../../../firebase/firebaseNode';
import { ErrorResponse } from '../ErrorResponse';
import { z } from 'zod';
import * as crypto from 'crypto';
import { SignUpSession, typeConverter, User } from '../DBTypes';

type Data = {
  challenge: string
  nonce: string
  id: string
}

const schema = z.object({
  email: z.string(),
  name: z.string()
})

export default async function handler(
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
  const { email, name } = schema.parse(req.body);

  const db = firebaseNode.firestore()
  // Check if user with the same email already exists in the db
  const existingUsers = await db
    .collection('users')
    .withConverter(typeConverter<User>())
    .where('email', '==', email)
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
    .collection('signUpSessions')
    .withConverter(typeConverter<SignUpSession>())
    .doc(signupNonce)
    .set({
      challenge: challenge,
      name: name,
      tempID: id
    })

  res.status(200).json({
    challenge: challenge,
    nonce: signupNonce,
    id: id
  })
}
