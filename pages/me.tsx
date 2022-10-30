import { GetServerSideProps, NextPage } from 'next';
import { Box, Typography } from '@mui/joy';
import validateJWT from '../auth/validateJWT';

type ProfileProps = {
  id: string
}

const Me: NextPage<ProfileProps> = (props) => {
  return <Box>
    <Typography>Me</Typography>
    <Typography>{props.id}</Typography>
  </Box>
}

export default Me

// noinspection JSUnusedGlobalSymbols - This is used by NextJS but WebStorm doesn't know that
export const getServerSideProps: GetServerSideProps<ProfileProps> = async ({ req }) => {
  const id = !req.cookies['token'] ? null : await validateJWT(req.cookies['token'])
  if (!id) return { redirect: { destination: '/auth', permanent: false } }
  console.log(id)
  return { props: {id} }
}