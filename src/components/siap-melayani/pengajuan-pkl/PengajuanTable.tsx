export default function PengajuanPKLTableSiapMelayani({
  pengajuan,
}: {
  pengajuan: any;
}) {
  const openPdf = (filePath: string) => {
    const frontendUrl = `/api/proxy/pdf?path=${encodeURIComponent(filePath)}`;
    window.open(frontendUrl, "_blank");
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "diproses") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          Diproses
        </span>
      );
    }
    if (s === "diterima") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          Diterima
        </span>
      );
    }
    if (s === "ditolak") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          Ditolak
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        {status || "-"}
      </span>
    );
  };

  const renderDocButton = (filePath?: string, label = "Lihat") => {
    if (!filePath) return <span className="text-slate-300">-</span>;
    return (
      <button
        type="button"
        onClick={() => openPdf(filePath)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-bpom-blue border border-blue-100/80 hover:bg-blue-100 transition-colors cursor-pointer"
        title={`Buka ${label}`}
      >
        <span className="material-symbols-outlined !text-[16px]">
          visibility
        </span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 my-2">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            <th className="px-4 py-3.5">Penempatan</th>
            <th className="px-4 py-3.5">Mulai</th>
            <th className="px-4 py-3.5">Berakhir</th>
            <th className="px-4 py-3.5 text-center">Surat Pengajuan</th>
            <th className="px-4 py-3.5 text-center">Proposal</th>
            <th className="px-4 py-3.5 text-center">Laporan Akhir</th>
            <th className="px-4 py-3.5 text-center">Sertifikat</th>
            <th className="px-4 py-3.5 text-center">Status</th>
            <th className="px-4 py-3.5">Catatan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {pengajuan?.data?.length > 0 ? (
            pengajuan.data.map((pengajuanPkl: any) => (
              <tr
                key={pengajuanPkl.id}
                className="hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-4 py-3.5 font-semibold text-slate-800">
                  {pengajuanPkl.position?.name || "-"}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                  {pengajuanPkl.period_start
                    ? new Date(pengajuanPkl.period_start).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "short", year: "numeric" },
                      )
                    : "-"}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                  {pengajuanPkl.period_end
                    ? new Date(pengajuanPkl.period_end).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "short", year: "numeric" },
                      )
                    : "-"}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {renderDocButton(pengajuanPkl.surat_pengajuan, "Surat")}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {renderDocButton(pengajuanPkl.proposal, "Proposal")}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {renderDocButton(
                    pengajuanPkl.peserta?.laporan_akhir,
                    "Laporan",
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {renderDocButton(
                    pengajuanPkl.peserta?.sertifikat,
                    "Sertifikat",
                  )}
                </td>
                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                  {renderStatusBadge(pengajuanPkl.status)}
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-500 max-w-xs">
                  {pengajuanPkl.catatan || "-"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-slate-300 !text-3xl">
                    inbox
                  </span>
                  <span className="text-sm">
                    Tidak ada data pengajuan PKL tersedia
                  </span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
