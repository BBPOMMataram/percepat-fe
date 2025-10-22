export default function TataTertibPklSiapMelayani() {

    return (
        <div id="informasi" className="min-h-screen my-8 flex justify-center items-center flex-col mx-2">
            <h2 className="text-center font-bold text-lg lg:text-3xl font-serif">ATURAN PRAKTIK KERJA LAPANGAN (PKL)</h2>
            <p className="text-center text-sm lg:text-base text-gray-700">Balai Besar Pengawas Obat dan Makanan (BBPOM) di Mataram</p>

            <div className="max-w-4xl mx-auto my-6 bg-white shadow-md rounded-xl p-6 prose prose-slate">
                <h1 className="text-2xl font-bold text-slate-800">Tata Tertib</h1>
                <p>Berikut aturan dan <b>tata tertib</b> yang berlaku. <b>Mohon dibaca dan dipatuhi</b> untuk menjaga ketertiban, keselamatan, dan kenyamanan bersama.</p>

                <ul className="pl-5 space-y-6 mt-4">
                    <li>
                        <h2 className="text-xl font-semibold">1. Jam Kerja</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Senin - Kamis : <span className="font-semibold">07.30 - 16.00 WITA</span></li>
                            <li>Jumat : <span className="font-semibold">07.30 - 16.30 WITA</span></li>
                            <li>Waktu Istirahat : <span className="font-semibold">12.00 - 13.00 WITA</span> (dapat menyesuaikan kegiatan, namun tetap wajib 1 jam).</li>
                            <li>Wajib check in dan check out melalui aplikasi <a href="https://siap-melayani.bbpommataram.id" className="text-blue-600 hover:underline">siap-melayani.bbpommataram.id</a></li>
                            <li>Apabila sakit / izin harap tetap check in dan out dengan melampirkan data dukung berupa surat keterangan sakit dari puskesmas/klinik, atau screenshot WA ke penyelia/ketua tim.</li>
                        </ul>
                    </li>

                    <li>
                        <h2 className="text-xl font-semibold">2. Tata Berpakaian (Dresscode)</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Wajib menggunakan pakaian berkerah, rapi, sopan, tidak diperkenankan menggunakan jeans, dan wajib menggunakan sepatu tertutup.</li>
                            <li>Dapat menyesuaikan dengan ketentuan warna pakaian pegawai:
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Senin : <span className="font-semibold">Biru</span></li>
                                    <li>Selasa : <span className="font-semibold">Krem</span></li>
                                    <li>Rabu : <span className="font-semibold">Putih</span></li>
                                    <li>Kamis : <span className="font-semibold">Batik</span></li>
                                    <li>Jumat : Pagi olahraga (kaos & training), setelah Jumatan menggunakan <span className="font-semibold">Batik</span></li>
                                </ul>
                            </li>
                        </ul>
                    </li>

                    <li>
                        <h2 className="text-xl font-semibold">3. Etika dan Perilaku</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Menjunjung tinggi sopan santun dan etika di lingkungan kerja.</li>
                            <li>Ikut menjaga kebersihan, ketertiban, dan kenyamanan lingkungan kerja.</li>
                            <li>Menerapkan Budaya 5S:</li>
                        </ul>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                            <span className="bg-slate-100 px-3 py-2 text-center rounded-md font-medium">Sambut</span>
                            <span className="bg-slate-100 px-3 py-2 text-center rounded-md font-medium">Salam</span>
                            <span className="bg-slate-100 px-3 py-2 text-center rounded-md font-medium">Senyum</span>
                            <span className="bg-slate-100 px-3 py-2 text-center rounded-md font-medium">Semangat</span>
                            <span className="bg-slate-100 px-3 py-2 text-center rounded-md font-medium">Solusi</span>
                        </div>
                    </li>

                    <li>
                        <h2 className="text-xl font-semibold">4. Administrasi</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Mahasiswa PKL wajib menandatangani Pakta Integritas dengan e-Meterai sesuai format yang telah ditentukan.</li>
                            <li>Setelah menyelesaikan PKL, mahasiswa wajib:
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Menyusun dan mengumpulkan Laporan PKL serta presentasi (PPT) dalam format <span className="font-semibold">.pdf (merged)</span> melalui aplikasi SIAP MELAYANI.</li>
                                    <li>Dokumen tersebut menjadi dasar penerbitan Surat Keterangan Selesai PKL dan Sertifikat PKL.</li>
                                </ul>
                            </li>
                        </ul>
                    </li>

                    <li>
                        <h2 className="text-xl font-semibold">5. Aturan Khusus Laboratorium</h2>
                        <p className="text-slate-700">Mengacu pada Kebijakan K3 Laboratorium BBPOM di Mataram:</p>

                        <h3 className="mt-3 font-semibold">5.1 Aturan Umum</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Menyimpan bahan beracun pada wadah khusus yang terkunci.</li>
                            <li>Menjaga kebersihan dan kerapian meja kerja; segera membersihkan apabila terjadi tumpahan.</li>
                            <li>Tidak diperkenankan merokok, makan, minum, atau menggunakan kosmetik di laboratorium.</li>
                        </ul>

                        <h3 className="mt-3 font-semibold">5.2 Keselamatan Personel</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Wajib menggunakan jas laboratorium, alas kaki tertutup, dan APD (masker, kacamata, sarung tangan) sesuai kebutuhan.</li>
                            <li>Jas laboratorium dan APD tidak boleh digunakan di luar area laboratorium.</li>
                            <li>Tidak diperkenankan bekerja seorang diri dalam pengujian berisiko tinggi; wajib didampingi penyelia.</li>
                            <li>Mencuci tangan dengan sabun setelah menggunakan zat kimia, sebelum makan, dan sebelum pulang.</li>
                        </ul>

                        <h3 className="mt-3 font-semibold">5.3 Penanganan Bahan Kimia</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Hindari kontak langsung dengan bahan kimia.</li>
                            <li>Gunakan lemari asam untuk pereaksi yang mudah menguap, iritan, atau beracun.</li>
                            <li>Dilarang membuang bahan kimia langsung ke wastafel; limbah harus dibuang ke wadah limbah sesuai ketentuan.</li>
                        </ul>

                        <h3 className="mt-3 font-semibold">5.4 Alat Gelas dan Peralatan</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Gunakan alat gelas sesuai ukuran (maksimal 80% kapasitas).</li>
                            <li>Sebelum pulang, alat gelas kotor wajib dicuci atau direndam dalam air bila tidak sempat dicuci.</li>
                            <li>Tidak meletakkan alat gelas di tepi meja untuk menghindari kecelakaan kerja.</li>
                        </ul>
                    </li>
                </ul>
                <a href="https://drive.google.com/file/d/1YCS_-Pm58v-DsCm6JIXuXFy7PlF3QZrw/view"
                    className="btn btn-primary mt-8"
                >Download</a>
            </div>
        </div>
    )
}