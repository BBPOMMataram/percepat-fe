import { Providers } from '@/redux/provider';
import { Josefin_Sans } from 'next/font/google';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

// CONFIG FONT AWESOME
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

const josefinSans = Josefin_Sans({ subsets: ['latin'] })

export const metadata = {
  title: {
    template: '%s | Percepat - BBPOM di Mataram',
    default: 'Home | Percepat - BBPOM di Mataram'
  },
  description: 'Aplikasi Persediaan Cepat Dan Tepat (PERCEPAT) - Inventaris Barang Reagen dan ATK Balai Besar POM di Mataram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (

    <html lang="en" className='scroll-smooth'>
      <body className={`${josefinSans.className} bg-primary`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
