import { NextApiRequest, NextApiResponse } from 'next';
import { ZodError } from 'zod';
import { ErrorResponse } from '../pages/api/ErrorResponse';

/**
 * Wrapper function that catches any exceptions during route execution
 * and returns a 500 with a JSON body instead
 */
const routeCatchable = <RespBody>(
  fn: (req: NextApiRequest, res: NextApiResponse<RespBody>) => void
) => async (req: NextApiRequest, res: NextApiResponse<RespBody | ErrorResponse>) => {
  try {
    await fn(req, res);
  } catch (e) {
    if (e instanceof ZodError) res.status(400).json({ error: 'Request body is badly formatted' })
    else res.status(500).json({ error: 'An exception was thrown while processing your request' });
  } finally {
    if (!res.headersSent) res.status(405).json({ error: 'No response' });
  }
};

export default routeCatchable