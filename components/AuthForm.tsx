import { FormEvent, useCallback, useState } from 'react';
import sendDelete from '../utils/req/sendDelete';
import sendPost from '../utils/req/sendPost';
import arrayBufferToB64 from '../utils/arrayBufferToB64';
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
} from '@mui/joy';
import CloseRounded from '../icons/CloseRounded';

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
 * @param challenge Registration challenge from server
 */
const webAuthnRegister = async (
  id: string,
  email: string,
  name: string,
  challenge: string
): Promise<Credential | null> => navigator.credentials.create({
  publicKey: {
    // Relying Party (a.k.a. - Service):
    rp: {
      name: 'WebAuthn Demo',
      id: location.hostname === 'localhost' ? 'localhost' : 'webauth.vercel.app'
    },

    // User:
    user: {
      id: new TextEncoder().encode(id),
      name: email,
      displayName: name
    },

    pubKeyCredParams: [{
      type: 'public-key',
      alg: -7 // EC256
    }],

    attestation: 'direct',

    timeout: 5*60*1000,

    challenge: new TextEncoder().encode(challenge)
  }
})

const AuthForm = () => {
  const [mode, setMode] = useState(AuthMode.Auth),
    [email, setEmail] = useState(''),
    [name, setName] = useState(''),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null)

  const handleFlowCancel = useCallback((msg: string, nonce: string) => {
    setError(msg)
    setLoading(false)
    sendDelete('/api/auth/signUp', { nonce: nonce }).then() // Ignore result
  }, [])

  const handleSubmit = useCallback(async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === AuthMode.Register) {
      const resp = await sendPost('/api/auth/signUp', { email: email, name: name })
      if (!resp.ok) {
        setLoading(false)
        return
      }
      const { challenge, nonce, id } = await resp.json()

      // Try WebAuthn registration
      let cred: PublicKeyCredential | null
      try {
        // Unsafe casting - Types for navigator.credential are broken
        // Steps 1 and 2 - Construct options, call navigator.credentials.create() and
        // pass options as the publicKey option
        cred = await webAuthnRegister(id, email, name, challenge) as PublicKeyCredential
      } catch (ex: any) {
        handleFlowCancel('WebAuthn exception: ' + ex.message, nonce)
        return
      }
      if (!cred) {
        handleFlowCancel('No credentials returned from WebAuthn create request', nonce)
        return
      }
      // Step 3 - Let response be credential.response. If response is not an instance of
      // AuthenticatorAttestationResponse, abort the ceremony with a user-visible error
      if (!(cred.response instanceof AuthenticatorResponse)) {
        handleFlowCancel('Did not receive a valid authenticator response', nonce)
        return
      }

      // Step 4 - Let clientExtensionResults be the result of calling credential.getClientExtensionResults()
      const
        clientExtensionResults = cred.getClientExtensionResults(),
        { response } = cred,
        { clientDataJSON, attestationObject } = response as AuthenticatorAttestationResponse
      // Step 5 - Run UTF-8 decode on the value of response.clientDataJSON
      const JSONText = new TextDecoder().decode(clientDataJSON)
      // Send attestation and client data JSON back to server
      const regResp = await sendPost('/api/auth/register', {
        clientData: JSONText,
        attestation: arrayBufferToB64(attestationObject),
        extensions: clientExtensionResults,
        nonce: nonce
      })
      if (regResp.ok) console.log('registration ok!')
      else setError('Server attestation verification failed')
    } else {
      console.log('Authentication is not implemented yet')
    }
    setLoading(false)
  }, [mode, email, name, handleFlowCancel]);

  return <Card variant={'outlined'} sx={{width: 400, gap: 1, boxShadow: 'md', m: 2}}>
    <Typography level={'h2'}>Welcome!</Typography>
    <Typography>Sign in or create an account</Typography>
    { error &&
        <Alert color={'danger'} sx={{mb: 1}}
               endDecorator={
                 <IconButton variant={'plain'} size={'sm'} color={'neutral'}
                             onClick={() => setError(null)}>
                   <CloseRounded />
                 </IconButton>
               }>
          {error}
        </Alert> }

    <Divider />

    <Tabs value={mode} onChange={(_, v) => setMode(v as AuthMode)}
          sx={{my: 1}}>
      <TabList variant={'plain'} sx={{p: 0}}>
        <Tab>Authenticate</Tab>
        <Tab>Register</Tab>
      </TabList>
    </Tabs>

    <form onSubmit={handleSubmit}>
      { mode === AuthMode.Register &&
          <TextField label={'Your Name'} type={'text'} required name={'name'} placeholder={'John Doe'}
                     value={name} onChange={evt => setName(evt.currentTarget.value)} sx={{pb: 1}} />
      }
      <TextField label={'Email'} type={'email'} required name={'email'}
                 placeholder={mode == AuthMode.Register
                   ? 'your-new-email@invalid.com'
                   : 'registered-email@invalid.com'}
                 value={email} onChange={evt => setEmail(evt.currentTarget.value)}
                 endDecorator={<Button type={'submit'}
                                       loading={loading} loadingIndicator={<CircularProgress size={'sm'} />}
                 >Continue</Button>} />
    </form>

    <Typography level={'body3'} mb={-.5}>
      Next: {mode == AuthMode.Register
      ? 'Register your authenticator'
      : 'Verify your identity with your authenticator'}
    </Typography>
  </Card>
}

export default AuthForm