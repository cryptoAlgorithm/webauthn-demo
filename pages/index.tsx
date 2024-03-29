import type { NextPage } from 'next'
import Head from 'next/head'
import { Box, Button, Card, Container, Divider, Typography, Link as JoyLink } from '@mui/joy'
import Link from 'next/link';
import Toolbar from '../components/Toolbar';
import EnhancedSecurity from '../icons/EnhancedSecurity';
import ProfileCard from '../components/ProfileCard';
import Image from 'next/image';
import favicon from '../public/favicon.png'
import RocketLaunch from '../icons/RocketLaunch';
import NavigateNext from '../icons/NavigateNext';

const Home: NextPage = () => {
  return <>
    <Head>
      <title>WebAuthn Landing</title>
    </Head>

    <Toolbar />

    <Container
      maxWidth={'sm'}
      sx={{
        textAlign: 'center', mt: '56px', py: 12,
        minHeight: 'calc(100vh - 240px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
    }}>
      <Typography level={'h1'} mb={2}>Taking <span style={{ color: 'var(--joy-palette-primary-400)' }}>Web Authen</span>tication to the next level</Typography>
      <Typography mb={2}>
        WebAuthn is the future of web authentication: single-click sign on, strong security
        and is virtually unphishable
      </Typography>
      <Box gap={1.5} display={'flex'} flexWrap={'wrap'} justifyContent={'center'}>
        <Link href={'/auth'} passHref legacyBehavior>
          <Button size={'lg'} component={'a'} sx={{ bgcolor: 'primary.500' }}
                  endDecorator={<NavigateNext />}>
            Give it a try!
          </Button>
        </Link>
        <Link href={'https://github.com/cryptoAlgorithm/webauthn-demo'} passHref legacyBehavior>
          <Button size={'lg'} component={'a'} variant={'plain'}
                  target={'_blank'} rel={'noopener noreferrer'}>
            Source code available on GitHub
          </Button>
        </Link>
      </Box>
    </Container>

    <Box bgcolor={'background.level1'} textAlign={'center'} py={6}>
      <Container maxWidth={'sm'}>
        <span style={{ fontSize: '4rem' }}><EnhancedSecurity /></span>
        <Typography level={'h2'} gutterBottom>Do away with easily guessed or hard-to-remember passwords</Typography>
        <Typography mb={2}>
          With the ability to sign in with just a tap, and backed by cryptographically-strong asymmetric keys,
          level up your authentication with WebAuthn
        </Typography>
      </Container>
    </Box>

    <Container maxWidth={'lg'} sx={{ py: 6 }}>
      <Box display={'flex'} flexDirection={'row-reverse'} flexWrap={'wrap'} justifyContent={'center'} gap={4}>
        <ProfileCard name={'You'}>
          <Card variant={'outlined'} row sx={{ p: 1, gap: 1.5, alignItems: 'center' }}>
            <Image src={favicon} alt={''} width={64} height={64} />
            <Box>
              <Typography fontWeight={'500'}>Implementing WebAuthn</Typography>
              <Typography>For 48 hours</Typography>
            </Box>
          </Card>
        </ProfileCard>
        <Box flex={1} minWidth={260}>
          <Typography level={'h2'} gutterBottom>WebAuthn replaces <i>both</i> a username and password</Typography>
          <Typography mb={2}>
            Sign your users in even without a username/email! WebAuthn credentials can be used
            to identify your users, so they need not remember which email they used to sign in anymore!
          </Typography>
          <Link href={'/auth'} passHref legacyBehavior>
            <Button size={'lg'} component={'a'} startDecorator={<RocketLaunch />}>Take WebAuthn for a spin</Button>
          </Link>
        </Box>
      </Box>
    </Container>

    <Divider />

    <Container maxWidth={'lg'} sx={{ py: 6 }}>
      { /* 2 h1s in a page is a no-no */ }
      <Typography level={'h1'} component={'h2'} gutterBottom>I ❤️ open source!</Typography>
      <Typography>
        This demo built in NextJS and is fully open-sourced under the permissive MIT license.
        As of now, it fully implements all required steps as defined by the latest W3C spec
        for registration and authentication.
      </Typography>
      <Box display={'grid'} gridTemplateColumns={'repeat(auto-fit, minmax(300px, 1fr))'} gap={2} mt={2}>
        <Card sx={{ gap: 1.5 }}>
          <Typography fontWeight={500}>GitHub Repository</Typography>
          <Typography>A single git repository holds both the backend and frontend code in one codebase</Typography>

          <Box flex={1} />
          <Link href={'https://github.com/cryptoAlgorithm/webauthn-demo'} legacyBehavior passHref>
            <Button size={'sm'} variant={'soft'} component={'a'}
                    rel={'noreferrer noopener'} target={'_blank'}>
              View repository on GitHub
            </Button>
          </Link>
        </Card>
        <Card sx={{ gap: 1.5 }}>
          <Typography fontWeight={500}>WebAuthn registration spec</Typography>
          <Typography>
            Read about the 26-step process relying parties should execute to create and validate
            a WebAuthn credential
          </Typography>

          <Box flex={1} />
          <Link href={'https://w3c.github.io/webauthn/#sctn-registering-a-new-credential'} legacyBehavior passHref>
            <Button size={'sm'} variant={'soft'} component={'a'}
                    rel={'noreferrer noopener'} target={'_blank'}>
              View section in W3C WebAuthn spec
            </Button>
          </Link>
        </Card>
        <Card sx={{ gap: 1.5 }}>
          <Typography fontWeight={500}>WebAuthn authentication spec</Typography>
          <Typography>
            Learn more about the 23-step process to retrieve and validate a registered WebAuthn credential
          </Typography>

          <Box flex={1} />
          <Link href={'https://w3c.github.io/webauthn/#sctn-verifying-assertion'} legacyBehavior passHref>
            <Button size={'sm'} variant={'soft'} component={'a'}
                    rel={'noreferrer noopener'} target={'_blank'}>
              View section in W3C WebAuthn spec
            </Button>
          </Link>
        </Card>
      </Box>
    </Container>

    <Box bgcolor={'background.surface'} py={3}>
      <Container maxWidth={'lg'}>
        <Box display={'flex'} alignItems={'center'} gap={2} mb={1.5}>
          <Typography fontFamily={'display'} level={'h4'} lineHeight={'32px'}>WebAuthn Demo</Typography>
          <Divider orientation={'vertical'} />
          <Typography>
            Another beautiful product by
            @<JoyLink href={'https://github.com/cryptoAlgorithm'}>cryptoAlgorithm</JoyLink> in
            collaboration with @<JoyLink href={'https://github.com/kwkinet'}>kwkinet</JoyLink>
          </Typography>
        </Box>
        <Typography level={'body2'}>
          This website is open source software, licenced under the MIT license
        </Typography>
      </Container>
    </Box>
  </>
}

export default Home
