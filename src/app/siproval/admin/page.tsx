import { redirect } from "next/navigation";

// Halaman awal PIC/Admin: Entry Data RHPK (database mandiri SIPROVAL, tanpa Google Sheets)
export default function AdminPage() {
  redirect("/siproval/admin/entry-data-rhpk");
}
