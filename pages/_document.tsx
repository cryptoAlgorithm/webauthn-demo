import { Html, Head, Main, NextScript } from 'next/document'
import { getInitColorSchemeScript } from '@mui/joy'

export default function Document() {
  return (
    <Html lang={'en'}>
      <Head>
        <meta name={'description'} content={'Simple CTAP WebAuthn demo'} />
        <meta name={'keywords'} content={'webauthn, demo, ctab'} />
        <link rel={'icon'} type={'image/png'} href={'/favicon.png'} />
      </Head>
      <body>
        {getInitColorSchemeScript({ defaultMode: 'dark' })}
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}