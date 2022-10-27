import { NextPage } from 'next';
import { Box, Button, Card, Divider, Modal, Sheet, Tab, TabList, Tabs, TextField, Typography } from '@mui/joy';
import { useEffect, useState } from 'react';
import Toolbar from '../component/Toolbar';

enum AuthMode {
  Auth, Register
}

const Auth: NextPage = () => {
  const [mode, setMode] = useState(AuthMode.Auth),
    [webAuthnSupport, setWebAuthnSupport] = useState(true);

  useEffect(() => {
    // Check for WebAuthn support if we are running in a browser (not SSR)
    if (window && !window.PublicKeyCredential) setWebAuthnSupport(false);
  }, []);

  return <Box display={'flex'} alignItems={'center'} justifyContent={'center'} minHeight={'100vh'}>
    <Toolbar />

    <Card variant={'outlined'} sx={{minWidth: 400, gap: 1, boxShadow: 'md'}}>
      <Typography level={'h2'}>Welcome!</Typography>
      <Typography>Sign in or create an account</Typography>

      <Divider />

      <Tabs value={mode} onChange={(_, v) => setMode(v as AuthMode)}
            sx={{my: 1}}>
        <TabList variant={'plain'} sx={{p: 0}}>
          <Tab>Authenticate</Tab>
          <Tab>Register</Tab>
        </TabList>
      </Tabs>

      <TextField label={'Email'}
                 placeholder={mode == AuthMode.Register
                   ? 'your-new-email@invalid.com'
                   : 'registered-email@invalid.com'}
                 endDecorator={<Button>Continue</Button>} type={'email'} />

      <Typography level={'body3'} mb={-.5}>
        Next: {mode == AuthMode.Register
          ? 'Populate your user info'
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