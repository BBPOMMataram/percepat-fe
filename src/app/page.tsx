import Hero from "@/components/header/Hero"
import Inventory from "@/components/inventory"
import Footer from "@/components/footer"

const Home = () => {

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