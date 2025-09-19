export default function ContentSiapMelayani() {
    return (
        <div id="informasi" className="min-h-screen my-4 flex justify-center items-center flex-col">
            <h2 className="text-center font-bold text-lg lg:text-3xl font-serif">Portal Layanan Informasi BBPOM di Mataram</h2>
            <p className="text-center text-sm lg:text-base text-gray-700">Berisi informasi tentang <b>Data PKL</b>, <b>Kunjungan</b>, serta <b>Pengajuan Narasumber</b></p>

            <div className="my-10 flex flex-col lg:flex-row items-stretch gap-6">
                <div className="card bg-base text-base-content shadow-xl">
                    <div className="card-body items-center text-center">
                        <h2 className="card-title">Pendaftaran dan Monitoring PKL</h2>
                        <p>Pengelolaan PKL meliputi proses permohonan, penerimaan peserta, serta monitoring jalannya PKL, baik reguler maupun MBKM, guna memastikan kelancaran dan transparansi pelaksanaan program</p>
                    </div>
                </div>
                <div className="card bg-base text-base-content shadow-xl">
                    <div className="card-body items-center text-center">
                        <h2 className="card-title">Permohonan Kunjungan</h2>
                        <p>Pengajuan permohonan kunjungan ke BBPOM Mataram dapat dipantau status permohonan, jadwal tersedia, dan konfirmasi penerimaan melalui sistem yang disediakan untuk kemudahan akses</p>
                    </div>
                </div>
                <div className="card bg-base text-base-content shadow-xl">
                    <div className="card-body items-center text-center">
                        <h2 className="card-title">Permohonan Narasumber</h2>
                        <p>Permohonan narasumber untuk kegiatan di tempat pemohon dapat diajukan dan dipantau statusnya, termasuk informasi siapa narasumber yang akan dihadirkan dan jadwal kegiatan</p>
                    </div>
                </div>
            </div>
        </div>
    )
}