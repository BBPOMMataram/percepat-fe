import { redirect } from "next/navigation";

export default function ProfilPage() {
  redirect("/siproval?tab=profil#dokumen-kinerja");
}

