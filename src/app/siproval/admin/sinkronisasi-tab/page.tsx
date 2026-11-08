import { redirect } from "next/navigation";

// Sinkronisasi tab dari Google Sheets sudah dihentikan; tab RHPK dikelola di database mandiri.
export default function SyncTabPage() {
  redirect("/siproval/admin/kelola-akses-rhpk");
}
