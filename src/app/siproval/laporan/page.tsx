import { redirect } from "next/navigation";

export default function LaporanPage() {
  redirect("/siproval?tab=laporan#dokumen-kinerja");
}

