import { NextPage } from 'next';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Divider, IconButton,
  Modal,
  Sheet,
  Tab,
  TabList,
  Tabs,
  TextField,
  Typography
} from '@mui/joy';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import Toolbar from '../components/Toolbar';
import CloseRounded from '../icons/CloseRounded';
import sendPost from '../utils/req/sendPost';
import arrayBufferToB64 from '../utils/arrayBufferToB64';
import sendDelete from '../utils/req/sendDelete';

enum AuthMode {
  Auth, Register
}

const webAuthnRegister = async (
  id: string,
  email: string,
  name: string,
  challenge: string
): Promise<Credential | null> => navigator.credentials.create({
  publicKey: {
    // Relying Party (a.k.a. - Service):
    rp: {
      name: "CTAP Demo",
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

const Auth: NextPage = () => {
  const [mode, setMode] = useState(AuthMode.Auth),
    [webAuthnSupport, setWebAuthnSupport] = useState(true),
    [email, setEmail] = useState(''),
    [name, setName] = useState(''),
    [loading, setLoading] = useState(false),
    [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for WebAuthn support if we are running in a browser (not SSR)
    if (window && !window.PublicKeyCredential) setWebAuthnSupport(false);
  }, []);

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
        cred = await webAuthnRegister(id, email, name, challenge) as PublicKeyCredential
      } catch (ex: any) {
        handleFlowCancel('WebAuthn exception: ' + ex.message, nonce)
        return
      }
      if (!cred) {
        handleFlowCancel('No credentials returned from WebAuthn create request', nonce)
        return;
      }

      const
        { response } = cred,
        { clientDataJSON, attestationObject } = response as AuthenticatorAttestationResponse
      // Send attestation and client data JSON back to server
      const regResp = await sendPost('/api/auth/register', {
        clientData: arrayBufferToB64(clientDataJSON),
        attestation: arrayBufferToB64(attestationObject),
        nonce: nonce
      })
      if (regResp.ok) console.log('registration ok!')
      else setError('Server attestation verification failed')
    } else {
      console.log('Authentication is not implemented yet')
    }
    setLoading(false)
  }, [mode, email, name, handleFlowCancel]);

  return <Box display={'flex'} alignItems={'center'} justifyContent={'center'} minHeight={'100vh'}>
    <Toolbar />

    <Card variant={'outlined'} sx={{width: 400, gap: 1, boxShadow: 'md', m: 2}}>
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

    { /* Unsupported browser info model */ }
    <Modal open={!webAuthnSupport} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Sheet variant={'outlined'}
             sx={{ maxWidth: 500, borderRadius: 'md', p: 3, boxShadow: 'lg', outline: 'none' }}>
        <Typography level={'h4'}>Oh no!</Typography>
        <Typography>
          Well that&apos;s unfortunate, it looks like WebAuthn isn&apos;t
          supported by your browser!
        </Typography>
        <Button href={'https://caniuse.com/webauthn'} fullWidth component={'a'} variant={'outlined'}
                target={'_blank'} rel={'noopener noreferrer'} sx={{mt: 2}}>
          Supported Browsers
        </Button>
      </Sheet>
    </Modal>
  </Box>
}

export default Auth