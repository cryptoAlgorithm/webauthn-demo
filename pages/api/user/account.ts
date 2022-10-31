import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse } from '../ErrorResponse';
import methodGuard from '../../../utils/req/methodGuard';
import { deleteTokenCookie } from './session';
import ensureTokenExists from '../../../auth/ensureTokenExists';
import firebaseNode from '../../../firebase/firebaseNode';
import { DBCollections } from '../DBTypes';

const handler = async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse>
) {
  // Only accepts DELETE requests (for now)
  if (methodGuard(['DELETE'], req, res)) return
  const uID = await ensureTokenExists(req)
  if (!uID) {
    res.status(400).json({ error: 'Invalid or no token'})
    return
  }

  // Delete the current user account
  try {
    await firebaseNode.firestore()
      .collection(DBCollections.users)
      .doc(uID)
      .delete({ exists: true })
  } catch (e) {
    res.status(404).json({ error: 'User does not exist' })
    return
  }

  // Then delete the token cookie
  deleteTokenCookie(res)
  res.status(204).end()
}

export default handler