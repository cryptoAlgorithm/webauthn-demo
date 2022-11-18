import {verify} from "jsonwebtoken";
import {NextApiRequest} from "next";

export function verifyToken(req: NextApiRequest) {
  const token = req.headers.authorization?.split(' ')
  if (!token || token.length !== 2) {
    throw new Error('Missing or bad bearer token')
  }
  if (token[0] !== 'Bearer')
    throw new Error('First token is not Bearer')
  let payload: any
  try {
    payload = verify(
      token[1], process.env.JWT_PUBLIC_KEY?.replaceAll('\\n', '\n') ?? 'missing pub key'
    )
  } catch (ex) {
    const err = ex as Error
    throw new Error('Verify bearer token failed:' + err.message)
  }
  if (typeof payload === 'string' || payload.type !== 'api-key')
    throw new Error('Invalid token type')
}
