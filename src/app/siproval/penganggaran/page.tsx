import { redirect } from "next/navigation";

export default function PenganggaranPage() {
  redirect("/siproval?tab=penganggaran#dokumen-kinerja");
}

