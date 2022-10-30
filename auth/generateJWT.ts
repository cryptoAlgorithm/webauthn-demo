import { sign } from 'jsonwebtoken';

/**
 * Generates a JWT for a user
 *
 * @param id ID of user to generate token for
 * @param expiresIn Number of seconds that the token is valid for
 * @return A JWT token
 */
const generateJWT = (id: string, expiresIn: number): Promise<string> => new Promise((res, rej) => {
  sign(
    { id },
    process.env.JWT_PRIVATE_KEY?.replaceAll('\\n', '\n') ?? 'invalid',
    {
      algorithm: 'ES512',
      expiresIn: expiresIn
    },
    (err, result) => {
      if (err || !result) rej(err)
      else res(result)
    }
  )
})

export default generateJWT