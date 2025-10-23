import ElearningSiapMelayani from "@/components/siap-melayani/e-learning/Elearning";

export default function SiapMelayaniTataTertibPklPage({ params }: { params: { category: string } }) {
    return (
        <>
            <ElearningSiapMelayani category={params.category} />
        </>
    )
}