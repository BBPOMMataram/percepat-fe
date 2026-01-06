"use client"
import Footer from "@/components/percepat/footer";
import Hero from "@/components/percepat/header/Hero";
import Inventory from "@/components/percepat/inventory";
const Percepat = () => {
    return (
        <div>
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