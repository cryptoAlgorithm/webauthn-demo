import { GetServerSideProps, NextPage } from 'next';
import {
  Box,
} from '@mui/joy';
import Toolbar from '../components/Toolbar';
import CheckWASupport from '../components/CheckWASupport';
import AuthForm from '../components/AuthForm';
import Head from 'next/head';
import validateJWT from '../auth/validateJWT';

const Auth: NextPage = () => {
  return <Box display={'flex'} alignItems={'center'} justifyContent={'center'} minHeight={'100vh'}>
    <Head>
      <title>Authenticate</title>
    </Head>

    <Toolbar />
    <AuthForm />
    <CheckWASupport />
  </Box>
}

export default Auth

// noinspection JSUnusedGlobalSymbols - This is used by NextJS but WebStorm doesn't know that
export const getServerSideProps: GetServerSideProps<{}> = async ({ req }) => {
  if (req.cookies['token'] && !!(await validateJWT(req.cookies['token'])))
    return { redirect: { destination: '/me', permanent: false } }
  return { props: {} }
}