import SidebarSiproval from "@/components/siproval/layout/SidebarSiproval";
import HeaderSiproval from "@/components/siproval/layout/HeaderSiproval";

export default function SiprovalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarSiproval actor="katim" />

      <main className="min-h-screen min-w-0 lg:ml-72">
        <HeaderSiproval
          title="Dashboard Evaluasi"
          description="Monitoring dan review laporan IKSK"
          userName="Kepala Balai"
        />

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
