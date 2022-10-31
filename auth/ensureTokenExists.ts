import { NextApiRequest } from 'next';
import validateJWT from './validateJWT';

/**
 * Ensure a token exists
 * @param req
 */
const ensureTokenExists = async <Request>(req: NextApiRequest): Promise<string | null> => {
  if (!req.cookies['token']) return null
  return await validateJWT(req.cookies['token'])
}

export default ensureTokenExists