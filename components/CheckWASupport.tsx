import { useEffect, useState } from 'react';
import { Button, Modal, Sheet, Typography } from '@mui/joy';

/**
 * Checks for WebAuthn support, displays a model which blocks user
 * interaction if WebAuthn isn't supported
 */
const CheckWASupport = () => {
  const [support, setSupport] = useState(true)
  useEffect(() => {
    // Check for WebAuthn support if we are running in a browser (not SSR)
    if (window && !window.PublicKeyCredential) setSupport(false);
  }, []);

  return <Modal open={!support} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
}

export default CheckWASupport