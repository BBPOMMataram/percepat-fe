"use client"

import { SideBar, TopBar } from '@/components/admin/layouts'
import Loading from '@/components/admin/layouts/Loading'
import { useAuth } from '@/hooks/auth'

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
                    <main className='p-4 mb-6'>
                        {children}
                    </main>
                </div>
            </div>
        )
}