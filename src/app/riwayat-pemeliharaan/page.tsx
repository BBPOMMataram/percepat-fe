import { redirect } from "next/navigation";

export default async function RiwayatPemeliharaanRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const token =
    typeof resolvedParams?.token === "string" ? resolvedParams.token : "";

  if (token) {
    redirect(`/simpel-bmn/pemeliharaan-rutin?token=${encodeURIComponent(token)}`);
  }

  redirect("/simpel-bmn/pemeliharaan-rutin");
}
