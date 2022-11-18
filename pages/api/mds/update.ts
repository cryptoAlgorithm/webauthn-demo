import type {NextApiRequest, NextApiResponse} from 'next'
import updateMDS from "../../../webAuthn/updateMDS";
import {ErrorResponse} from "../ErrorResponse";
import methodGuard from "../../../utils/req/methodGuard";
import createLogger from "../../../utils/createLogger";
import {verifyToken} from "../../../utils/req/verifyToken";

type Data = {
  count: number
}

const logger = createLogger('mds-update-route')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  logger.info({req})

  // Only accepts DELETE requests (for now)
  if (methodGuard(['POST'], req, res)) return

  try {
    verifyToken(req)
  } catch (ex) {
    const err = ex as Error
    logger.error({error: err.message}, 'API auth error')
    res.status(401).end()
    return
  }

  try {
    const count = await updateMDS()
    res.status(200).json({count})
  } catch (ex) {
    res.status(500).json({error: 'MDS update failed'})
  }
}