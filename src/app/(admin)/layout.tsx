"use client"

import { SideBar, TopBar } from '@/components/admin/layouts'
import { useAuth } from '@/hooks/auth'
import { useEffect } from 'react'
import { BiLoaderCircle } from 'react-icons/bi'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user } = useAuth({ middleware: 'auth' })
    useEffect(() => {
        console.log(user);

    })
    return !user ? <BiLoaderCircle className="mx-auto mt-24 text-5xl text-quaternary animate-spin"></BiLoaderCircle>
        : (
            <>
                <section className='flex'>
                    <aside className='min-h-screen flex flex-col'>
                        <SideBar />
                    </aside>
                    <main className='flex-1 transition-all'>
                        <TopBar />
                        {children}
                    </main>
                </section>
            </>
        )
}