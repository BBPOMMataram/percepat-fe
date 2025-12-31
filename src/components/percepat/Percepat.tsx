"use client"
import Hero from "@/components/percepat/header/Hero";
import Inventory from "@/components/percepat/inventory";
import FooterBottomSiMandalika from "../simandalika/footer/FooterBottom";

const Percepat = () => {
    return (
        <div>
            <header>
                <Hero />
            </header>
            <main className="min-h-screen p-4" id="inventory">
                <Inventory />
            </main>
            <footer>
                {/* <Footer /> */}
                <FooterBottomSiMandalika />
            </footer>
        </div>
    )
}

export default Percepat