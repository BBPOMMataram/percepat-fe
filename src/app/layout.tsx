import { Providers } from '@/redux/provider';
import 'react-toastify/dist/ReactToastify.css';
import './percepat/globals.css';

import Alert from '@/components/main/Alert';
import Loading from '@/components/percepat/admin/layouts/Loading';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
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
    // data-theme nanti buatkan toggle dark mode
    <html lang="id" data-scroll-behavior="smooth">
      <head>
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
