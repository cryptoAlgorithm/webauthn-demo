/**
 * Utility function to send a POST request and get its result
 */
const sendPost = async (
  path: string,
  body: any = {}
): Promise<Response> => fetch(path, {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})

export default sendPost