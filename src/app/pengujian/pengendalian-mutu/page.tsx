import PengendalianMutuList from "@/components/pengujian/pengendalian-mutu/PengendalianMutuList";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Daftar Pengendalian Mutu Pengujian",
};

export default function PengendalianMutuPage() {
    return <PengendalianMutuList />;
}
