import HeroSiapMelayani from "./header/Hero";
import StatistikPklSiapMelayani from "./landing-page-content/Statistik";

export default function MainSiapMelayani() {
    return (
        <div className="space-y-12">
            <HeroSiapMelayani />
            <StatistikPklSiapMelayani />
        </div>
    )
}