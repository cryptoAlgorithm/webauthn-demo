const sendDelete = async (path: string, body: any = {}) => fetch(path, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})

export default sendDelete