import { NextApiResponse } from 'next';
import { ErrorResponse } from '../pages/api/ErrorResponse';
import { AuthedData } from '../pages/api/auth/authenticate';
import generateJWT from './generateJWT';

export const JWT_VALIDITY = 10*60 // = 10min (Default number of seconds a JWT token is valid for)

/**
 * Send a response to indicate a user is signed in
 *
 * This will generate a token JWT and set a cookie, then respond with
 * the duration that the JWT will be valid for.
 * TODO: Provide a refresh token to allow refreshing expired tokens
 * @param id User ID to generate auth response for
 * @param res Response object to use
 * @param cookieSecureOnly If the Secure option should be set in the returned cookie
 */
const authResponse = async (
  id: string,
  res: NextApiResponse<AuthedData | ErrorResponse>,
  cookieSecureOnly: boolean = false
) => {
  const jwt = await generateJWT(id, JWT_VALIDITY)
  res.setHeader(
    'Set-Cookie',
    `token=${jwt}; Max-Age=${JWT_VALIDITY}; HttpOnly; Path=/;` + (cookieSecureOnly ? ' Secure;' : '')
  )
  res.status(200).json({ renewIn: JWT_VALIDITY })
}

export default authResponse