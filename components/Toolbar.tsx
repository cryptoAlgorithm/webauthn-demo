import { Box, Button, Card, Typography, useColorScheme } from '@mui/joy'
import Image from 'next/image'
import icon from '../public/favicon.png'
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Toolbar component
 * Unfortunately doesn't exist as a prebuilt component yet
 * @constructor
 */
const Toolbar = () => {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <Box top={0} left={0} right={0} position={'absolute'}>
    <Card variant={'outlined'}
          sx={{
            display: 'flex', width: '100vw', p: 1.5, '--Card-radius': 0, borderWidth: '0 0 1px 0',
            flexDirection: 'row', alignItems: 'center', gap: 1.5
    }}>
      <Link href={'/'} style={{display: 'flex'}}>
        <Image src={icon} alt={''} width={32} />
      </Link>
      <Typography level={'h6'}>CTAP WebAuthn</Typography>
      <Box flexGrow={1} />
      { mounted && <Button
          size={'sm'} variant={'soft'} onClick={() => setMode(mode == 'light' ? 'dark' : 'light')}>
          Turn {mode == 'light' ? 'off' : 'on'} the lights</Button> }
    </Card>
  </Box>
}

export default Toolbar;