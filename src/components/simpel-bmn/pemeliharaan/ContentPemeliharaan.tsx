import dayjs from "dayjs";

export default function ContentPemeliharaan({ data, handleOpenDetail }: { data: any[], handleOpenDetail: (code: string) => void }) {
    return (
        <>
            <h2 className="mb-10 font-bold text-lg lg:text-3xl font-serif">Data Pemeliharaan Anda</h2>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Kode</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Tipe Barang</th>
                            <th className="px-4 py-3 text-left">Tanggal Lapor</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500">
                                    Belum ada data pemeliharaan
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className={`border-t transition`}
                                >
                                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">
                                        {item.code}
                                    </td>
                                    <td className={`px-4 py-3 font-semibold ${item.status === 'open' ? 'text-bpom-green' : 'text-red-500'}`}>{item.status}</td>
                                    <td className={`px-4 py-3 uppercase`}>{item.tipe}</td>

                                    <td className="px-4 py-3 text-sm ">
                                        {dayjs(item.created_at).format("DD MMM YYYY")}
                                        <br />
                                        {dayjs(item.created_at).format("HH:mm:ss")}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleOpenDetail(item.code)}
                                            className="btn btn-sm btn-accent btn-soft"
                                        >
                                            <span className="hidden lg:block">Detail</span>
                                            <span className="material-symbols-outlined">
                                                visibility
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}