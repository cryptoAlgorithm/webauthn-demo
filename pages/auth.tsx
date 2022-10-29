import { NextPage } from 'next';
import {
  Box,
} from '@mui/joy';
import Toolbar from '../components/Toolbar';
import CheckWASupport from '../components/CheckWASupport';
import AuthForm from '../components/AuthForm';
import Head from 'next/head';

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