import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import DetailPemeliharaan from "./DetailPemeliharaan";
import ListDisposisiPemeliharaan from "./ListDisposisiPemeliharaan";
import PermintaanBarangPemeliharaan from "./PermintaanBarangPemeliharaan";
import TableListBarangSimpelBmn from "./TableListBarang";

interface ModalDetailPemeliharaanProps {
    show: boolean;
    onClose: () => void;
    code: string;
}

export default function ModalDetailPemeliharaan({
    show,
    onClose,
    code,
}: ModalDetailPemeliharaanProps) {
    const dispatch = useDispatch<AppDispatch>();

    const [detailData, setDetailData] = useState<any>(null);
    const [pelaporData, setPelaporData] = useState<any>(null);
    const [listDisposisi, setListDisposisi] = useState<any[]>([]);

    const printRef = useRef<HTMLDivElement>(null);

    const getDetailPemeliharaan = useCallback(() => {
        if (!code) return; // hindari fetch kalau code kosong/null

        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-detail`,
            { code }
        ).then((res) => {
            setDetailData(res?.data);
            setListDisposisi(res?.data?.disposisi_new_pemeliharaan);

            // AMBIL DATA PELAPOR DAN DARI RELATIONNYA DENGAN FUNGSI UNTUK MENGAMBIL FUNGSI/BIDANG
            api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-by-id/${res?.data?.pelapor?.external_user_id}`)
                .then((res) => {
                    setPelaporData(res?.data);
                }).catch((err) => {
                    dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                    console.log(err);
                })
        }).catch((err) => {
            dispatch(showAlert({ type: "error", message: "Pemeliharaan tidak ditemukan", description: "Pemeliharaan tidak ditemukan" }));
            setDetailData(null);
            setPelaporData(null);
            setListDisposisi([]);

            console.log(err);
            onClose();
        });
    }, [code, dispatch, onClose]);

    useEffect(() => {
        if (show && code) {
            getDetailPemeliharaan();
        }
    }, [show, code, getDetailPemeliharaan]);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open("", "", "width=900,height=650");

        // Ambil semua <style> dan <link rel="stylesheet">
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(node => node.outerHTML)
            .join("\n");

        printWindow?.document.write(`
            <html>
                <head>
                    <title>Cetak Pemeliharaan</title>
                    ${styles} 
                    <style>
                        @page { size: A4; margin: 20mm; }
                        body { padding: 20px; }
                    </style>
                </head>
                <body>
                    ${content.innerHTML}
                </body>
            </html>
        `);

        printWindow?.document.close();

        setTimeout(() => {
            printWindow?.focus();
            printWindow?.print();
            printWindow?.close();
        }, 400);
    };


    if (!show) return null;
    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 w-full max-w-6xl space-y-4 mx-4 overflow-auto h-[calc(100vh-2rem)]"
                onClick={(e) => e.stopPropagation()}
                ref={printRef}
            >
                <DetailPemeliharaan detailData={detailData} pelaporData={pelaporData} />
                <TableListBarangSimpelBmn listBarangRusak={detailData?.barang_new_pemeliharaan} />
                <ListDisposisiPemeliharaan listDisposisi={listDisposisi} />
                <PermintaanBarangPemeliharaan barangPengadaan={detailData?.pengadaan} />
                <div className="flex w-fit ml-auto gap-2 mt-10">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="btn btn-primary"
                    >
                        Print
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    )
}