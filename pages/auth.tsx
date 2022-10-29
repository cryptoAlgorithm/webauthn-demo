import { NextPage } from 'next';
import {
  Box,
} from '@mui/joy';
import Toolbar from '../components/Toolbar';
import CheckWASupport from '../components/CheckWASupport';
import AuthForm from '../components/AuthForm';

const Auth: NextPage = () => {
  return <Box display={'flex'} alignItems={'center'} justifyContent={'center'} minHeight={'100vh'}>
    <Toolbar />
    <AuthForm />
    <CheckWASupport />
  </Box>
}

export default Auth