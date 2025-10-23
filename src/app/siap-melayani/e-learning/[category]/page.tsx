import ElearningSiapMelayani from "@/components/siap-melayani/e-learning/Elearning";

export default async function SiapMelayaniTataTertibPklPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params
    return <ElearningSiapMelayani category={category} />
}