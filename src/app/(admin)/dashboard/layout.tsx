import { SideBar, TopBar } from '@/components/admin/layouts'
import { useAuth } from '@/hooks/auth'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
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