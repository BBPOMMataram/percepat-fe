import { Providers } from '@/redux/provider';
import { Josefin_Sans } from 'next/font/google';
import 'react-toastify/dist/ReactToastify.css';
import './percepat/globals.css';

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import Loading from '@/components/percepat/admin/layouts/Loading';
config.autoAddCss = false

const josefinSans = Josefin_Sans({ subsets: ['latin'] })

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
      <head />
      <body className={`${josefinSans.className} bg-primary`}>
        <Providers>
          {/* Remove loader after hydration */}
          {/* <ClientLoaderRemover /> */}
          <Loading />
          {children}
        </Providers>
      </body>
    </html>
  )
}
