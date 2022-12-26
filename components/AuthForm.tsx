import {FormEvent, useCallback, useEffect, useLayoutEffect, useState} from 'react'
import sendDelete from '../utils/req/sendDelete'
import sendPost from '../utils/req/sendPost'
import arrayBufferToB64 from '../utils/arrayBufferToB64'
import {
  Alert,
  Button,
  Card,
  CircularProgress,
  Divider,
  IconButton,
  Tab,
  TabList,
  Tabs,
  TextField,
  Typography
} from '@mui/joy'
import CloseRounded from '../icons/CloseRounded'
import {useRouter} from 'next/router';

enum AuthMode {
  Auth, Register
}

/**
 * Constructs a publicKey options object and calls navigator.credentials.create
 * with those options
 *
 * Carries out steps 1 and 2 of https://w3c.github.io/webauthn/#sctn-registering-a-new-credential
 * @param id User ID
 * @param email User email
 * @param name User display name
 * @param timeout Registration timeout
 * @param uvRequired If user presence is required or just preferred
 * @param challenge Registration challenge from server
 */
const webAuthnRegister = async (
  id: string,
  email: string,
  name: string,
  timeout: number,
  uvRequired: boolean,
  challenge: string
): Promise<Credential | null> => navigator.credentials.create({
  publicKey: {
    // Relying Party (a.k.a. - Service):
    rp: {
      name: 'webauthn-demo',
      id: location.hostname === 'localhost' ? 'localhost' : 'webauth.vercel.app'
    },

    authenticatorSelection: {
      requireResidentKey: false,
      residentKey: 'preferred',
      userVerification: uvRequired ? 'required' : 'preferred',
      authenticatorAttachment: 'cross-platform'
    },

    // User:
    user: {
      id: new TextEncoder().encode(id),
      name: email,
      displayName: name
    },

    pubKeyCredParams: [{
      type: 'public-key',
      alg: -7 // ES256
    }, {
      type: 'public-key',
      alg: -257 // RS256
    }],

    attestation: 'direct',

    timeout: timeout,

    challenge: new TextEncoder().encode(challenge),

    excludeCredentials: []
  }
})

const webAuthnAuth = async (
  challenge: string,
  timeout: number,
  uvRequired: boolean
) => navigator.credentials.get({
  publicKey: {
    challenge: new TextEncoder().encode(challenge),
    timeout: timeout,
    rpId: location.hostname === 'localhost' ? 'localhost' : 'webauth.vercel.app',
    userVerification: uvRequired ? 'required' : 'preferred',
  }
})

const useLayoutEffectExceptSSR = typeof window === 'undefined' ? useEffect : useLayoutEffect

const AuthForm = () => {
  const [mode, setMode] = useState(AuthMode.Auth),
    [email, setEmail] = useState(''),
    [name, setName] = useState(''),
    [loading, setLoading] = useState(false),
    [emailError, setEmailError] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null)

  const router = useRouter()

  // Clear errors when the email input or mode changes
  const clearErrors = useCallback(() => {
    setEmailError(null)
    setError(null)
  }, [])
  useLayoutEffectExceptSSR(clearErrors, [email, mode])

  const handleFlowCancel = useCallback((msg: string, nonce: string, isSignUp: boolean = true) => {
    setError(msg)
    setLoading(false)
    sendDelete(
      '/api/auth/' + (isSignUp ? 'signUp' : 'signIn'),
      {nonce: nonce}
    ).then() // Ignore result
  }, [])

  const handleSignUp = useCallback(async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    setLoading(true)
    clearErrors()

    const resp = await sendPost('/api/auth/signUp', {email: email.trim(), name: name.trim()})
    if (!resp.ok) {
      setLoading(false)
      if (resp.status === 403) setEmailError('Account already exists, try authenticating instead')
      else setEmailError('Failed to initiate registration')
      return
    }
    // Get registration params from server, no validation done as server is trusted
    const {challenge, nonce, id, timeout, uv} = await resp.json()

    // Try WebAuthn registration
    let cred: PublicKeyCredential | null
    try {
      // Steps 1 and 2 - Construct options, call navigator.credentials.create() and
      // pass options as the publicKey option
      cred = await webAuthnRegister(
        id, email.trim(), name.trim(),
        timeout,
        uv,
        challenge
      ) as PublicKeyCredential
    } catch (e) {
      const ex = e as Error
      handleFlowCancel(
        ex.name === 'NotAllowedError'
          ? 'Registration cancelled by user'
          : 'Registration failed: ' + ex.message,
        nonce
      )
      return
    }
    // Step 3 - Let response be credential.response. If response is not an instance of
    // AuthenticatorAttestationResponse, abort the ceremony with a user-visible error
    if (!cred || !(cred.response instanceof AuthenticatorResponse)) {
      handleFlowCancel('Did not receive a valid authenticator response', nonce)
      return
    }

    // Step 4 - Let clientExtensionResults be the result of calling credential.getClientExtensionResults()
    const
      clientExtensionResults = cred.getClientExtensionResults(),
      response = cred.response as AuthenticatorAttestationResponse,
      {clientDataJSON, attestationObject} = response

    // Step 5 - Run UTF-8 decode on the value of response.clientDataJSON
    const JSONText = new TextDecoder().decode(clientDataJSON)
    // Send attestation and client data JSON back to server
    const regResp = await sendPost('/api/auth/register', {
      clientData: JSONText,
      attestation: arrayBufferToB64(attestationObject),
      extensions: clientExtensionResults,
      nonce: nonce
    })
    if (regResp.ok) await router.push('/me')
    else setError('Server registration verification failed')
    setLoading(false)
  }, [email, name, handleFlowCancel, router, clearErrors]);

  const handleSignIn = useCallback(async () => {
    setLoading(true)
    clearErrors()

    const initResp = await sendPost('/api/auth/signIn')
    if (!initResp.ok) setError('Failed to initiate auth ceremony with server')
    const {nonce, challenge, timeout, uv} = await initResp.json()

    let credential: PublicKeyCredential
    try {
      // Step 1 and 2 - Get cred with config
      credential = await webAuthnAuth(challenge, timeout, uv) as PublicKeyCredential
    } catch (e) {
      const ex = e as Error
      handleFlowCancel(
        ex.name === 'NotAllowedError'
          ? 'Authentication cancelled by user'
          : 'Authentication failed: ' + ex.message,
        nonce, false
      )
      return
    }
    const {response} = credential
    // Step 3 - If response is not an instance of AuthenticatorAssertionResponse,
    // abort the ceremony with a user-visible error.
    if (!(response instanceof AuthenticatorAssertionResponse)) {
      handleFlowCancel('Did not receive a valid authenticator response', nonce, false)
      return
    }
    // Step 4 - Let clientExtensionResults be the result of calling credential.getClientExtensionResults()
    const clientExtensionResults = credential.getClientExtensionResults()
    // Step 5 - skipped as we do not know the user prior to the auth ceremony

    const {authenticatorData, clientDataJSON, userHandle, signature} = response

    // Step 6b (i) - Verify that response.userHandle is present
    if (!userHandle) {
      handleFlowCancel('No user handle was returned', nonce, false)
      return
    }

    const authResp = await sendPost('/api/auth/authenticate', {
      clientData: new TextDecoder().decode(clientDataJSON),
      authData: arrayBufferToB64(authenticatorData),
      sig: arrayBufferToB64(signature),
      userHandle: new TextDecoder().decode(userHandle),
      credID: arrayBufferToB64(credential.rawId),
      extensions: clientExtensionResults,
      nonce: nonce
    })
    if (!authResp.ok) {
      // Check if we received an error payload from the server
      if (authResp.headers.get('Content-Type')?.includes('application/json')) {
        setError((await authResp.json())['error']) // Show the server error if so
      } else {
        setError('Server failed to verify WebAuthn authentication')
      }
    } else await router.push('/me')

    setLoading(false)
  }, [router, handleFlowCancel, clearErrors])

  return <Card variant={'outlined'} sx={{width: 400, gap: 1, boxShadow: 'md', m: 2}}>
    <Typography level={'h2'}>Welcome!</Typography>
    <Typography>Sign in or create an account</Typography>
    {error &&
      <Alert
        color={'danger'} sx={{mb: 1}}
        endDecorator={
          <IconButton variant={'plain'} size={'sm'} color={'danger'} onClick={() => setError(null)}>
            <CloseRounded/>
          </IconButton>
        }>
        {error}
      </Alert>
    }

    <Divider/>

    <Tabs value={mode} onChange={(_, v) => setMode(v as AuthMode)}
          sx={{my: 1}}>
      <TabList variant={'plain'} sx={{p: 0}}>
        <Tab variant={mode == AuthMode.Auth ? 'soft' : 'plain'}>Authenticate</Tab>
        <Tab variant={mode == AuthMode.Register ? 'soft' : 'plain'}>Register</Tab>
      </TabList>
    </Tabs>

    {mode === AuthMode.Register &&
      <form onSubmit={handleSignUp}>
        <TextField label={'Name'} type={'text'} required placeholder={'John Doe'} disabled={loading}
                   value={name} onChange={evt => setName(evt.currentTarget.value)} sx={{pb: 1}}/>
        <TextField
          label={'Email'} error={!!emailError} helperText={emailError} disabled={loading}
          type={'email'} required
          placeholder={mode == AuthMode.Register
            ? 'your-new-email@invalid.com'
            : 'registered-email@invalid.com'}
          value={email} onChange={evt => setEmail(evt.currentTarget.value)}
          endDecorator={
            <Button type={'submit'}
                    loading={loading} loadingIndicator={<CircularProgress size={'sm'}/>}>Continue</Button>}
        />
      </form>
    }

    {mode === AuthMode.Auth &&
      <Button size={'lg'} onClick={handleSignIn}
              loading={loading} loadingIndicator={<CircularProgress size={'sm'}/>}>
        Sign In
      </Button>
    }

    <Typography level={'body3'} mb={-.5}>
      Next: {mode == AuthMode.Register
      ? 'Register your authenticator'
      : 'Verify your identity with your authenticator'}
    </Typography>
  </Card>
}

export default AuthForm