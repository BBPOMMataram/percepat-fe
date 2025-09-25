import HeroSiapMelayani from "./header/Hero";
import ContentSiapMelayani from "./landing-page-content/Content";
import StatistikPklSiapMelayani from "./landing-page-content/Statistik";

export default function MainSiapMelayani() {
    return (
        <>
            <HeroSiapMelayani /> {/* <-- ini di dalam <main> tidak di <header> karena layout next js nya ga bisa handle */}
            <ContentSiapMelayani />
            <StatistikPklSiapMelayani />
        </>
    )
}