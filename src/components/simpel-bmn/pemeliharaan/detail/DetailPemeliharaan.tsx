import dayjs from "dayjs";

export default function DetailPemeliharaan({ detailData, pelaporData }: any) {
    return (
        <>
            <h2 className="text-lg font-semibold font-serif">Data Pemeliharaan</h2>

            <div className="mb-4 flex flex-col gap-1">
                <div className="flex items-center space-x-2">
                    <span className="font-semibold">Kode:</span>
                    <span className="text-bpom-blue">{detailData?.code} (<span className={`font-semibold animate-pulse uppercase ${detailData?.status !== 'open' && 'text-red-500'}`}>{detailData?.status}</span>)</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="font-semibold">Kategori:</span>
                    <span className="text-bpom-blue uppercase">{detailData?.tipe}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="font-semibold">Kantor:</span>
                    <span className="text-bpom-blue">{'Balai Besar POM di Mataram'}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="font-semibold">Fungsi:</span>
                    <span className="text-bpom-blue">{pelaporData?.employee?.fungsi?.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="font-semibold">Pelapor:</span>
                    <span className="text-bpom-blue">{pelaporData?.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="font-semibold">Email Pelapor:</span>
                    <span className="text-bpom-blue">{pelaporData?.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="font-semibold">Tanggal lapor:</span>
                    <span className="text-bpom-blue">{dayjs(detailData?.created_at).format('DD MMM YYYY - HH:mm')}</span>
                </div>
            </div>
        </>
    )
}