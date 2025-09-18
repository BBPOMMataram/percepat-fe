import 'react-toastify/dist/ReactToastify.css';
// import './percepat/globals.css';

import SideBar from '@/components/admin/layout/SideBar';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false

export const metadata = {
  title: {
    template: '%s | BBPOM di Mataram',
    default: 'Dashboard Admin | BBPOM di Mataram'
  },
  description: 'Aplikasi Balai Besar POM di Mataram',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen min-w-screen flex">
      <aside>
        <SideBar />
      </aside>
      <main className='flex-1 p-6'>
        {children}
      </main>
    </div>
  )
}
