import { GetServerSideProps, NextPage } from 'next';
import { Box, Button, Container, Divider, Modal, ModalDialog, Stack, Typography } from '@mui/joy';
import validateJWT from '../auth/validateJWT';
import firebaseNode from '../firebase/firebaseNode';
import { DBCollections, typeConverter, User } from './api/DBTypes';
import { createHash } from 'crypto';
import ProfileCard from '../components/ProfileCard';
import Toolbar from '../components/Toolbar';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import sendDelete from '../utils/req/sendDelete';
import { useState } from 'react';

export type ProfileProps = {
  id: string
  email: string
  name: string
  avatarURL: string
  credentialID: string // For displaying in the demo
}

const Me: NextPage<ProfileProps> = (
  { id, email, name, avatarURL, credentialID }
) => {
  const router = useRouter()
  const [confirmDeletePresenting, setConfirmDeletePresenting] = useState(false)

  return <>
    <Head><title>My Account</title></Head>

    <Toolbar position={'relative'} />
    <Container maxWidth={'md'}>
      <Typography level={'h1'} mt={3} gutterBottom>Hi {name}!</Typography>
      { /* The direction is reversed to allow proper flexbox wrapping */ }
      <Box display={'flex'} flexDirection={'row-reverse'} flexWrap={'wrap'} justifyContent={'center'} gap={3}>
        <ProfileCard id={id} email={email} name={name} avatarURL={avatarURL} credentialID={credentialID}>
          <Link href={'https://github.com/cryptoAlgorithm/webauthn-demo'} passHref legacyBehavior>
            <Button variant={'soft'} size={'sm'} component={'a'}
                    target={'_blank'} rel={'noopener noreferrer'}>
              View source on GitHub
            </Button>
          </Link>
        </ProfileCard>

        <Box flex={1} display={'flex'} flexDirection={'column'} gap={1.5} minWidth={300}>
          <Typography>
            You&apos;re logged in with WebAuthn! Check out your profile
            on the right, or explore the few options available below.
          </Typography>

          <Divider />

          <div>
            <Typography level={'h4'} gutterBottom>Account Actions</Typography>
            <Typography gutterBottom>
              After signing out, you&apos;ll need to sign in again to access this page
              but your account will be preserved.
            </Typography>
            <Button
              variant={'outlined'} color={'danger'}
              onClick={async () => {
                await sendDelete('/api/user/session')
                await router.push('/auth')
              }}>
              Sign Out
            </Button>
            <Typography mt={2} gutterBottom>
              Deleting your action is a permanent action - you can&apos;t recover it
              once it&apos;s deleted.
            </Typography>
            <Button variant={'soft'} color={'danger'} onClick={() => setConfirmDeletePresenting(true)}>
              Delete Account
            </Button>
          </div>
        </Box>
      </Box>
    </Container>

    <Modal open={confirmDeletePresenting} onClose={() => setConfirmDeletePresenting(false)}>
      <ModalDialog
        sx={{
          maxWidth: 200,
          borderRadius: 'md',
          p: 2,
          boxShadow: 'lg',
          textAlign: 'center'
        }}
      >
        <Typography level={'h5'} fontFamily={'display'} lineHeight={'28px'} gutterBottom>
          Are you sure you&apos;d like to delete your account?
        </Typography>
        <Typography mb={2}>This action <b>cannot be undone</b>!</Typography>
        <Stack spacing={1}>
          <Button
            variant={'outlined'} color={'danger'} size={'sm'}
            onClick={async () => {
              await sendDelete('/api/user/account')
              await router.push('/auth')
            }}
          >
            Delete Account
          </Button>
          <Button onClick={() => setConfirmDeletePresenting(false)}>Cancel</Button>
        </Stack>
      </ModalDialog>
    </Modal>
  </>
}

export default Me

// noinspection JSUnusedGlobalSymbols - This is used by NextJS but WebStorm doesn't know that
export const getServerSideProps: GetServerSideProps<ProfileProps> = async ({ req }) => {
  const red = { redirect: { destination: '/auth', permanent: false } } // Redirect to auth page if unauthenticated
  // Get token cookie and try parsing it
  const id = !req.cookies['token'] ? null : await validateJWT(req.cookies['token'])
  if (!id) return red

  // Attempt to retrieve the user from the database
  const userDoc = await firebaseNode.firestore()
    .collection(DBCollections.users)
    .withConverter(typeConverter<User>())
    .doc(id)
    .get()
  const user = userDoc.data()
  if (!user) return red

  // Construct Gravatar URL email hash
  const emailHash = createHash('md5').update(user.email.toLowerCase().trim()).digest('hex')
  const avatarURL = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=160`

  return {
    props: {
      id,
      email: user.email,
      name: user.name,
      avatarURL,
      credentialID: user.credential.credentialID.toString('base64'),
    }
  }
}