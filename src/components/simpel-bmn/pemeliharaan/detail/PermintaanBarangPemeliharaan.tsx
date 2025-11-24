
export default function PermintaanBarangPemeliharaan({ barangPengadaan }: any) {
    if (barangPengadaan?.length === 0) return null
    return (
        <div>
            <h2 className="mb-4 font-semibold text-lg font-serif">Permintaan Pengadaan Barang</h2>
            <div>
                <ul className="bg-base-100 rounded-box shadow-md list-decimal list-inside p-4">
                    {barangPengadaan?.map((item: any, i: number) => (
                        <li key={i}>{item.name}</li>
                    ))}
                </ul >
            </div >
        </div >
    )
}