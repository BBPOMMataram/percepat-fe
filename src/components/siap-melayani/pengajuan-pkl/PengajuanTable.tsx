export default function PengajuanPKLTableSiapMelayani({ pengajuan }: { pengajuan: any }) {
    const openPdf = (filePath: string) => {
        const frontendUrl = `/api/proxy/pdf?path=${encodeURIComponent(filePath)}`;
        window.open(frontendUrl, "_blank");
    };

    return (
        <div className="w-full overflow-auto my-4">
            <table className="table table-zebra">
                {/* head */}
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Penempatan</th>
                        <th>Mulai</th>
                        <th>Berakhir</th>
                        <th className="text-center">Surat Pengajuan</th>
                        <th className="text-center">Proposal</th>
                        <th className="text-center">Laporan Akhir</th>
                        <th className="text-center">Sertifikat</th>
                        <th>Status</th>
                        <th>Catatan</th>
                    </tr>
                </thead>
                <tbody>
                    {pengajuan?.data?.length > 0 ? pengajuan.data.map((pengajuanPkl: any, index: number) =>
                        <tr key={pengajuanPkl.id} className="[&>td]:align-top">
                            <td>{++index}</td>
                            <td>{pengajuanPkl.position.name || '-'}</td>
                            <td>{pengajuanPkl.period_start ? new Date(pengajuanPkl.period_start).toLocaleString('id-ID', { dateStyle: 'full' }) : '-'}</td>
                            <td>{pengajuanPkl.period_end ? new Date(pengajuanPkl.period_start).toLocaleString('id-ID', { dateStyle: 'full' }) : '-'}</td>
                            <td className="text-center">{
                                pengajuanPkl.surat_pengajuan ?
                                    <button onClick={() => openPdf(pengajuanPkl.surat_pengajuan)} className="cursor-pointer">
                                        <span className="material-symbols-outlined text-bpom-green">
                                            eye_tracking
                                        </span>
                                    </button>
                                    : '-'
                            }</td>
                            <td className="text-center">{
                                pengajuanPkl.proposal ?
                                    <button onClick={() => openPdf(pengajuanPkl.proposal)} className="cursor-pointer">
                                        <span className="material-symbols-outlined text-bpom-green">
                                            eye_tracking
                                        </span>
                                    </button>
                                    : '-'
                            }</td>
                            <td className="text-center">{
                                pengajuanPkl.peserta?.laporan_akhir ?
                                    <button onClick={() => openPdf(pengajuanPkl.peserta.laporan_akhir)} className="cursor-pointer">
                                        <span className="material-symbols-outlined text-bpom-green">
                                            eye_tracking
                                        </span>
                                    </button>
                                    : '-'
                            }</td>
                            <td className="text-center">{
                                pengajuanPkl.peserta?.sertifikat ?
                                    <button onClick={() => openPdf(pengajuanPkl.peserta.sertifikat)} className="cursor-pointer">
                                        <span className="material-symbols-outlined text-bpom-green">
                                            eye_tracking
                                        </span>
                                    </button>
                                    : '-'
                            }</td>
                            <td>{pengajuanPkl.status || '-'}</td>
                            <td>{pengajuanPkl.catatan || '-'}</td>
                        </tr>
                    ) : (
                        <tr>
                            <td colSpan={5} className="text-center text-slate-500 py-4">
                                Tidak ada posisi PKL tersedia
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )

}