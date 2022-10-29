import { Box, Button, Card, Chip, Typography, useColorScheme } from '@mui/joy'
import Image from 'next/image'
import icon from '../public/favicon.png'
import Link from 'next/link';
import { useEffect, useState } from 'react';

const BrandingText = (props: { brand: string, isBeta?: boolean }) => {
  const { brand, isBeta = true } = props
  return <Box position={'relative'}>
    <Typography level={'h6'}>{ brand }</Typography>
    { isBeta &&
      <Chip size={'sm'} color={'warning'} variant={'soft'} sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        textTransform: 'uppercase',
        transform: 'translateX(55%) translateY(-8%) rotate(30deg)',
        '--Chip-minHeight': 16,
        '--Chip-paddingInline': '.4rem'
      }}>
        Beta
      </Chip>
    }
  </Box>
}

/**
 * Toolbar component
 *
 * Unfortunately doesn't exist as a prebuilt component yet, so this
 * component builds a bare-bones one from scratch.
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
      <BrandingText brand={'WebAuthn'} />

      <Box flexGrow={1} />
      { mounted && <Button
          size={'sm'} variant={'soft'} onClick={() => setMode(mode == 'light' ? 'dark' : 'light')}>
          Turn {mode == 'light' ? 'off' : 'on'} the lights</Button> }
    </Card>
  </Box>
}

export default Toolbar;