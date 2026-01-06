"use client"
import ReagenEdNotifer from '@/components/percepat-new/admin/barang/reagen-ed/ReagenEdNotifer'
import { ToastContainer } from 'react-toastify'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {

    return (
        <div className='flex'>
            <aside className='min-h-screen flex flex-col'>
                {/* <SideBar /> */}
            </aside>
            <div className='flex-1 transition-all'>
                <header>
                    {/* <TopBar /> */}
                </header>
                <div>
                    <main className='p-4 mb-6'>
                        <ReagenEdNotifer />
                        {children}
                        <ToastContainer />
                    </main>
                    <footer className='bg-secondary px-4 pb-2 pt-5 border-t border-quaternary text-quaternary'>
                        <p>
                            PERCEPAT &copy; Balai Besar Pengawas Obat dan Makanan di Mataram
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    )
}