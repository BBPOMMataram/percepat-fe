
export default function TableListBarangSimpelBmn({ listBarangRusak }: any) {
    return (
        <div>
            <h2 className="mb-4 font-semibold text-lg font-serif">List Barang</h2>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Nama</th>
                            <th className="px-4 py-3 text-left">Kode</th>
                            <th className="px-4 py-3 text-left">NUP</th>
                            <th className="px-4 py-3 text-left">Keluhan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listBarangRusak?.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500">
                                    Belum ada data barang rusak.
                                </td>
                            </tr>
                        ) : (
                            listBarangRusak?.map((item: any, index: number) => (
                                <tr
                                    key={item.id}
                                    className={`border-t transition`}
                                >
                                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                                    <td className="px-4 py-3">
                                        {item.barang.nama}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.barang.kode}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.barang.nup}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.keluhan}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}