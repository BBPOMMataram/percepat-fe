"use client"

import Loading from "@/components/admin/layouts/Loading"
import Footer from "@/components/footer"
import Hero from "@/components/header/Hero"
import Inventory from "@/components/inventory"
import { useEffect, useState } from "react"

const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoading(false)
    }
  }, [loading])

  return loading ?
    <Loading />
    : (
      <>
        <header>
          <Hero />
        </header>
        <main className="min-h-screen p-4 bg-primary" id="inventory">
          <Inventory />
        </main>
        <footer>
          <Footer />
        </footer>
      </>
    )
}

export default Home