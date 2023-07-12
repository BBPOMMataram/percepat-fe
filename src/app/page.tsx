"use client"

import Footer from "@/components/footer"
import Hero from "@/components/header/Hero"
import Inventory from "@/components/inventory"
import { useEffect, useState } from "react"
import { BiLoaderCircle } from "react-icons/bi"

const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLoading(false)
    }
  }, [loading])

  return loading ?
    <div className="text-center">
      <BiLoaderCircle className="mx-auto mt-24 mb-6 text-5xl text-quaternary animate-spin"></BiLoaderCircle>
      <div>Terimakasih atas kesabaran Anda menunggu ;)</div>
    </div>
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