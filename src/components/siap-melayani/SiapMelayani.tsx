import HeroSiapMelayani from "./header/Hero";
import NavBarSiapMelayani from "./header/NavBar";

export default function MainSiapMelayani() {
    return (
        <>
            <header className="h-screen flex flex-col">
                <NavBarSiapMelayani />
                <HeroSiapMelayani />
            </header>
            <main className="lg:px-14">
                siap melayani
            </main>
            <footer>

            </footer>
        </>
    )
}