import { GetServerSideProps, NextPage } from 'next';
import { Container, Typography } from '@mui/joy';
import validateJWT from '../auth/validateJWT';
import firebaseNode from '../firebase/firebaseNode';
import { DBCollections, typeConverter, User } from './api/DBTypes';
import { createHash } from 'crypto';
import ProfileCard from '../components/ProfileCard';

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
  return <Container maxWidth={'md'}>
    <Typography level={'display2'}>Hi {name}!</Typography>
    <ProfileCard id={id} email={email} name={name} avatarURL={avatarURL} credentialID={credentialID} />
  </Container>
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