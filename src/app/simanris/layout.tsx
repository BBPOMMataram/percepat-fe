import SimanrisShell from "@/components/simanris/layout/SimanrisShell";

export default function SimanrisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SimanrisShell>{children}</SimanrisShell>;
}
