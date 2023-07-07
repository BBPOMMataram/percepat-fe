"use client"

import Hero from "@/components/header/Hero"
import Inventory from "@/components/inventory"
import Footer from "@/components/footer"
import axios from "@/config/axios"
import { useEffect } from "react"

const Home = () => {
  useEffect(() => {
    axios.get('testing').then((res: any) => console.log(res))
  })
  return (
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