export default function StatistikPklSiapMelayani() {
    return (
        <div id="statistik" className="min-h-screen my-4 flex justify-center items-center flex-col">
            <h2 className="text-center font-bold text-lg lg:text-3xl font-serif">Statistik PKL</h2>
            <p className="text-center text-sm lg:text-base text-gray-700">Data statistik Mahasiswa PKL di Balai Besar POM di Mataram</p>

            <div className="my-10 flex flex-col lg:flex-row items-stretch gap-6">
                <div className="card bg-base-100 w-96 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title">0 Pengajuan</h2>
                        <p>Total pengajuan Mahasiswa PKL di Balai Besar POM di Mataram</p>
                    </div>
                </div><div className="card bg-base-100 w-96 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title">0 Aktif</h2>
                        <p>Total Mahasiswa PKL aktif di Balai Besar POM di Mataram</p>
                    </div>
                </div><div className="card bg-base-100 w-96 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title">0 Kuota tersedia</h2>
                        <p>Jumlah kuota PKL yang tersedia saat ini di Balai Besar POM di Mataram</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    {/* head */}
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Posisi</th>
                            <th>Kulifikasi Jurusan</th>
                            <th>Keterangan</th>
                            <th>Kuota Tersedia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* row 1 */}
                        <tr>
                            <th>1</th>
                            <td>Cy Ganderton</td>
                            <td>Quality Control Specialist</td>
                            <td>Blue</td>
                            <td className="text-center">10</td>
                        </tr>
                        {/* row 2 */}
                        <tr>
                            <th>2</th>
                            <td>Hart Hagerty</td>
                            <td>Desktop Support Technician</td>
                            <td>Purple</td>
                            <td className="text-center">10</td>
                        </tr>
                        {/* row 3 */}
                        <tr>
                            <th>3</th>
                            <td>Brice Swyre</td>
                            <td>Tax Accountant</td>
                            <td>Red</td>
                            <td className="text-center">10</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}