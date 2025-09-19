import ContentSiapMelayani from "./content/Content";
import StatistikPklSiapMelayani from "./content/Statistik";
import FooterSiapMelayani from "./footer/Footer";
import HeroSiapMelayani from "./header/Hero";
import NavBarSiapMelayani from "./header/NavBar";

export default function MainSiapMelayani() {
    return (
        <>
            <header className="h-screen flex flex-col">
                <NavBarSiapMelayani />
                <HeroSiapMelayani />
            </header>
            <main className="lg:px-14 py-12 px-4">
                <ContentSiapMelayani />
                <StatistikPklSiapMelayani />
            </main>
            <footer>
                <FooterSiapMelayani />
            </footer>
        </>
    )
}