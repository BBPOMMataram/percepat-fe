import ElearningSiapMelayani from "@/components/siap-melayani/e-learning/Elearning";

export default function SiapMelayaniTataTertibPklPage({ params }: { params: Promise<{ category: string }> }) {
    return (
        <>
            <ElearningSiapMelayani category={params.category} />
        </>
    )
}