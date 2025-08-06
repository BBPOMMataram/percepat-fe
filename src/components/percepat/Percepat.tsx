"use client"
import Loading from "@/components/percepat/admin/layouts/Loading"
import Footer from "@/components/percepat/footer"
import Hero from "@/components/percepat/header/Hero"
import Inventory from "@/components/percepat/inventory"
import { useEffect, useState } from "react"
import { Josefin_Sans } from 'next/font/google';

const josefinSans = Josefin_Sans({ subsets: ['latin'] })

const Percepat = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false)
    }, [])

    return loading ? <Loading />
        : (
            <div className={`${josefinSans.className}`} >
                <header>
                    <Hero />
                </header>
                <main className="min-h-screen p-4 bg-primary" id="inventory">
                    <Inventory />
                </main>
                <footer>
                    <Footer />
                </footer>
            </div>
        )
}

export default Percepat