"use client"

import { useAuth } from "@/hooks/auth"

const Dashboard = () => {
    const { user } = useAuth({ middleware: 'auth' })
    return user ? (
        <section className="p-4">
            Title here
        </section>
    ) : null
}

export default Dashboard