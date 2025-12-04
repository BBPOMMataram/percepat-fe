import Image from "next/image";

export default function TableListBarangNonBmnSimpelBmn({ listBarangRusak }: any) {
    return (
        <div className="mb-6">
            <h2 className="mb-4 font-semibold text-lg font-serif">List Barang</h2>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Nama</th>
                            <th className="px-4 py-3 text-left">Merk</th>
                            <th className="px-4 py-3 text-left">Lokasi</th>
                            <th className="px-4 py-3 text-left">Keluhan</th>
                            <th className="px-4 py-3 text-center">Foto Bukti</th>
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
                                        {item.nama_barang}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.merk_barang}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.lokasi_barang}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.keluhan}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.foto_bukti ? (
                                            <Image src={item.foto_bukti} alt={`Foto bukti ${item.nama}`} width={100} height={100} priority className="mx-auto w-32 h-auto p-2" />
                                        ) : <p>Tidak ada gambar</p>}
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