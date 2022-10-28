import { CircularProgress } from '@mui/joy';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Loader during route changes
 * @constructor
 */
const RoutingLoader = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url: any) => (url !== router.asPath) && setLoading(true);
    const handleComplete = (url: any) => (url === router.asPath) && setLoading(false);

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  })

  return <>
    { loading && <CircularProgress sx={{position: 'fixed', right: 24, bottom: 24, zIndex: 100}} /> }
  </>
}

export default RoutingLoader