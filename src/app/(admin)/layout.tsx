"use client"

import { SideBar, TopBar } from '@/components/admin/layouts'
import Loading from '@/components/admin/layouts/Loading'
import { useAuth } from '@/hooks/useAuth'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = useAuth({ middleware: 'auth' })

    return !user ? <Loading />
        : (
            <div className='flex'>
                <aside className='min-h-screen flex flex-col'>
                    <SideBar />
                </aside>
                <div className='flex-1 transition-all'>
                    <header>
                        <TopBar />
                    </header>
                    <div>
                        <main className='p-4 mb-6'>
                            {children}
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