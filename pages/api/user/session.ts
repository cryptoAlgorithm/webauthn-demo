import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse } from '../ErrorResponse';
import methodGuard from '../../../utils/req/methodGuard';

export const deleteTokenCookie = <Resp>(res: NextApiResponse<Resp>) => {
  res.setHeader(
    'Set-Cookie',
    `token=""; Expires=${new Date(0).toUTCString()}; HttpOnly; Path=/;`
  )
  res.status(204).end()
}

const handler = async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse>
) {
  // Only allow POST or DELETE requests
  if (methodGuard(['POST', 'DELETE'], req, res)) return

  // Delete auth token - sign out
  if (req.method === 'DELETE') {
    deleteTokenCookie(res)
    return
  }
  // TODO: Rate-limit this
  // Refresh JWT token

}

export default handler