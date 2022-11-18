import type {NextApiRequest, NextApiResponse} from 'next'
import updateMDS from "../../../webAuthn/updateMDS";
import {ErrorResponse} from "../ErrorResponse";
import methodGuard from "../../../utils/req/methodGuard";

type Data = {
  count: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  // Only accepts DELETE requests (for now)
  if (methodGuard(['POST'], req, res)) return

  try {
    const count = await updateMDS()
    res.status(200).json({count})
  } catch (ex) {
    res.status(500).json({error: 'MDS update failed'})
  }
}