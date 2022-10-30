import { verify } from 'jsonwebtoken';

/**
 * Decodes and verifies a JWT token with the EC JWT signing key
 *
 * > Note:
 * > Does not validate if the user ID contained within the JWT is valid
 * @param jwt JWT token to verify
 * @return User ID if token could be parsed and validated, null otherwise
 */
const validateJWT = (jwt: string): Promise<string | null> => new Promise(res => {
  verify(
    jwt,
    // Use a dummy string as fallback which will fail validation (not a valid PEM)
    process.env.JWT_PUBLIC_KEY?.replaceAll('\\n', '\n') ?? 'missing pub key',
    (err, payload) => {
      if (err) res(null)
      else if (!payload || typeof payload === 'string' || !payload['id']) res(null)
      else res(payload['id'])
    }
  )
})

export default validateJWT