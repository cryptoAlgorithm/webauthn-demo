# FIDO2 WebAuthn Demo

> An next.js application for demonstrating registration and authentication 
> with a FIDO2 authenticator using the WebAuthn API.

Hosted demo (login/signup page) available [here](https://webauth.vercel.app).

## Status
Currently, this WebAuthn demo...
* implements all required steps for WebAuthn registration and 
validation as required by the [spec](https://w3c.github.io/webauthn/#sctn-rp-operations)
  * attestation statement validation is partially complete,
  with support for `packed` and `none` formats
  * attestation data signature validation with X.509 certs
  does not currently validate the whole chain of trust
  * importing of both RSA and EC COSE-encoded keys are supported
  * logging during various steps of validation are processed with
  pino logger, and pretty printed only during development
* stores the created credential during registration in a Firebase
database as a [credential record](https://w3c.github.io/webauthn/#credential-record)
* does all necessary validation to prevent duplicate registrations etc.
* authenticates user sessions with a JWT token (with a lifetime of 30
minutes) with the ES512 algorithm
* displays user info when the user is logged in
* allows the user to log out or delete their account

## Development
1. Rename `.env.example` to `.env.local`
2. Generate an EC 256-bit private key with openssl:
`openssl ecparam -name prime256v1 -genkey -noout -out private-key.pem`,
then derive the public key with `openssl ec -in private-key.pem -pubout -out public-key.pem`
3. Create a [Firebase project](https://console.firebase.google.com/), then create a service account and download its credentials
4. Populate the respective values in `.env.local`, replacing `\n` in
keys with `\\n`
5. Install dependencies with `yarn install` (or simply `yarn`) and
run `yarn run dev` to start the NextJS dev server

## Deployment
Want to host your own instance of this demo? Hit the deploy button
below to host this project on Vercel! Remember to configure environment
variables (outlined in the steps above) in the Vercel dashboard too.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FcryptoAlgorithm%2Fwebauthn-demo)

###### _This is purely for demonstration purposes and isn't suitable for use in production._
