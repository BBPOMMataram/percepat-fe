import { Providers } from '@/redux/provider';
import 'react-toastify/dist/ReactToastify.css';
import './percepat/globals.css';

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import Loading from '@/components/percepat/admin/layouts/Loading';
import Alert from '@/components/main/Alert';
config.autoAddCss = false

export const metadata = {
  title: {
    template: '%s | BBPOM di Mataram',
    default: 'Home | BBPOM di Mataram'
  },
  description: 'Aplikasi Balai Besar POM di Mataram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className='scroll-smooth'>
      <head>
        {/* <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=optional" rel="stylesheet" /> */}
      </head>
      <body>
        <Providers>
          <Loading />
          <Alert />
          {children}
        </Providers>
      </body>
    </html>
  )
}
