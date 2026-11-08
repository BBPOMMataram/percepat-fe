import { redirect } from "next/navigation";

// Formulir Google Sheet lama sudah dihentikan; pengisian data melalui Entry Data RHPK (database mandiri).
export default function GoogleSheetsPage() {
  redirect("/siproval/katim/entry-data-rhpk");
}
