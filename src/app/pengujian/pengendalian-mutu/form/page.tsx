import PengendalianMutuForm from "@/components/pengujian/pengendalian-mutu/PengendalianMutuForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Form Pengendalian Mutu Pengujian",
};

export default function PengendalianMutuFormPage() {
    return <PengendalianMutuForm />;
}
