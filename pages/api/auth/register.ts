import type { NextApiRequest, NextApiResponse } from 'next'
import firebaseNode from '../../../firebase/firebaseNode';
import { ErrorResponse } from '../ErrorResponse';
import { z } from 'zod';
import { SignUpSession, typeConverter } from '../DBTypes';
import validateRegistration from '../../../webAuthn/validateRegistration';

type Data = {
  success: boolean
}

const schema = z.object({
  clientData: z.string(),
  attestation: z.string(),
  nonce: z.string()
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
  const { clientData, attestation, nonce } = schema.parse(req.body);

  const db = firebaseNode.firestore()
  const signUpSession = await db
    .collection('signUpSessions')
    .withConverter(typeConverter<SignUpSession>())
    .doc(nonce)
    .get()
  if (!signUpSession.exists || !signUpSession.data()) {
    res.status(403).json({ error: 'Invalid signup session nonce' })
    return
  }
  // Delete temp session from db
  await signUpSession.ref.delete()

  // Validate registration parameters
  try {
    const regData = await validateRegistration(
      Buffer.from(clientData, 'base64'),
      attestation,
      signUpSession.data()!.challenge,
      ['http://localhost:3000', 'https://webauth.vercel.app'],
      ['localhost', 'webauth.vercel.app']
    )
    console.log(regData)
    res.status(200).json({ success: true })
  } catch (ex: any) {
    res.status(400).json({ error: 'Could not verify WebAuthn attestation' })
    console.log(ex.message)
  }
}
