import { Box, Chip, Typography, Sheet, IconButton, useColorScheme, Tooltip, Button } from '@mui/joy'
import Image from 'next/image'
import icon from '../public/favicon.png'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DarkMode from '../icons/DarkMode';
import LightMode from '../icons/LightMode';
import GitHubIcon from '../icons/GitHubIcon';

const BrandingText = (props: { brand: string, isBeta?: boolean }) => {
  const { brand, isBeta = true } = props
  const [mouseOver, setMouseOver] = useState(false)
  return <Typography level={'h6'} position={'relative'} height={28}
                onMouseEnter={() => setMouseOver(true)}
                onMouseLeave={() => setMouseOver(false)}>
    { brand }
    { isBeta &&
      <Chip size={'sm'} color={'warning'} variant={'soft'} sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        '--Chip-minHeight': 16,
        '--Chip-paddingInline': '.4rem',
        textTransform: 'uppercase',
        // Spaces at the end of the line doesn't play well with multiline backquoted strings,
        // so we'll just concatenate several together here
        transform: `translateX(${mouseOver ? 'calc(100% + .25rem)' : '55%'}) ` +
          `translateY(${mouseOver ? '5px' : '-8%'}) ` +
          `rotate(${mouseOver ? 0 : 30}deg)`,
        transition: 'transform .2s ease-in-out'
      }}>
        { /* Use textTransform to make this uppercase for better accessibility */ }
        Beta
      </Chip>
    }
  </Typography>
}

type Props = {
  position?: 'absolute' | 'relative' | 'fixed'
}

/**
 * Toolbar component
 *
 * Unfortunately doesn't exist as a prebuilt component yet, so this
 * component builds a bare-bones one from scratch.
 */
const Toolbar = ({ position = 'fixed' }: Props) => {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return <Sheet
    variant={'outlined'}
    sx={{
      display: 'flex', position: position, top: 0, left: 0, right: 0, p: 1.5, zIndex: 100,
      borderWidth: '0 0 1px 0', flexDirection: 'row', alignItems: 'center', gap: 1, '--Card-radius': 0
    }}
  >
    <Link href={'/'} style={{display: 'flex'}}>
      <Image src={icon} alt={'Home'} width={32} />
    </Link>
    <BrandingText brand={'WebAuthn'} />

    <Box flexGrow={1} />
    <Link href={'https://github.com/cryptoAlgorithm/webauthn-demo'} passHref legacyBehavior>
      <Button size={'sm'} variant={'outlined'} component={'a'} startDecorator={<GitHubIcon />}
              target={'_blank'} rel={'noreferrer noopener'}>
        Repository
      </Button>
    </Link>
    <Tooltip title={`Turn ${mode === 'light' ? 'off' : 'on'} the lights`} variant={'soft'} arrow>
      <IconButton
        size={'sm'} variant={'outlined'}
        onClick={() => mounted && setMode(mode === 'light' ? 'dark' : 'light')}>
        { mode === 'light' ? <DarkMode /> : <LightMode /> }
      </IconButton>
    </Tooltip>
  </Sheet>
}

export default Toolbar;