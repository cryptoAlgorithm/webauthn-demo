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

###### _This is purely for demonstration purposes and isn't suitable for use in production._
