import { NextApiRequest, NextApiResponse } from 'next';

type Method = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE'

const methodGuard = <Response>(
  allowedMethods: Method[],
  req: NextApiRequest,
  res: NextApiResponse<Response>
): boolean => {
  if (!req.method || !allowedMethods.includes(req.method as Method)) {
    res.setHeader('Allow', allowedMethods)
    res.status(405).end(`Allowed methods: ${allowedMethods.join(', ')}`)
    return true
  }
  return false
}

export default methodGuard