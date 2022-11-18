// Run this file to generate an API bearer token

const {sign} = require('jsonwebtoken')
require('dotenv').config()

if (!process.env.JWT_PRIVATE_KEY) {
  console.error(
    `The EC JWT private key is not present in the .env file!
Please update the .env file according to the example in .env.example.`
  )
  process.exit(1)
}

console.log('Hold on while your token is being generated...')

const token = sign(
  {'type': 'api-key'},
  process.env.JWT_PRIVATE_KEY?.replaceAll('\\n', '\n') ?? 'invalid',
  {algorithm: 'ES512'}
)

console.log('Your token is:', token)