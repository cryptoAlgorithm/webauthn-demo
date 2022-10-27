// Fonts
import '@fontsource/ibm-plex-sans'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/plus-jakarta-sans/800.css'
import type { AppProps } from 'next/app'
import { CssVarsProvider } from '@mui/joy/styles';
import { CssBaseline, extendTheme } from '@mui/joy';

const theme = extendTheme({
  fontFamily: {
    body: '"IBM Plex Sans", var(--joy-fontFamily-fallback)',
    display: '"Plus Jakarta Sans", "IBM Plex Sans", var(--joy-fontFamily-fallback)'
  },
  fontWeight: {
    xl: 800,
  }
})

function App({ Component, pageProps }: AppProps) {
  return <CssVarsProvider
    theme={theme}
    colorSchemeStorageKey={'theme'}
    modeStorageKey={'theme'}
    defaultColorScheme={'dark'}
    defaultMode={'dark'}>
    <CssBaseline />
    <Component {...pageProps} />
  </CssVarsProvider>
}

export default App
