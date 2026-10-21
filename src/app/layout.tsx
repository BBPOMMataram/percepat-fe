import { Providers } from '@/redux/provider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './percepat-new/globals.css';

import Alert from '@/components/main/Alert';
import Loading from '@/components/main/loading/Loading';

export const metadata = {
  title: {
    template: '%s | BBPOM di Mataram',
    default: 'Home | BBPOM di Mataram'
  },
  description: 'Aplikasi Balai Besar POM di Mataram',
  icons: {
    icon: '/favicon.ico',
  },
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
          <ToastContainer position="top-right" autoClose={4000} theme="colored" />
          {children}
        </Providers>
      </body>
    </html>
  )
}
