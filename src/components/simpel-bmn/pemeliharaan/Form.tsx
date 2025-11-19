"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import QRScannerModal from "./QRScannerModal";

export default function FormPemeliharaanSimpelBmn() {
    const [kodeBarang, setKodeBarang] = useState("");
    const [nup, setNup] = useState("");
    const [listBarang, setDaftar] = useState<any>([]);
    const [openScanner, setOpenScanner] = useState(false);
    const { user } = useSelector((state: RootState) => state.auth);
    const [tipeBarang, setSetTipeBarang] = useState("non-lab");
    const [kaTu, setKaTu] = useState<any>({});
    const [listKaTimPengujian, setListKaTimPengujian] = useState<any[]>([]);
    const [kaTimPengujianId, setKaTimPengujianId] = useState<any>("");
    const [note, setNote] = useState<string>("");

    const dispatch = useDispatch<AppDispatch>();

    const handleInputQrCode = () => setOpenScanner(true);

    const router = useRouter();

    const listTipeBarang = [
        'lab', 'non-lab', 'non-bmn'
    ];

    const getKaTu = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-katu`
        ).then((res) => {
            setKaTu(res.data);
        })
    }

    const getKaTimPengujian = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-katim-pengujian`
        ).then((res) => {
            setListKaTimPengujian(res.data);
        })
    }

    useEffect(() => {
        getKaTu();

        if (tipeBarang === 'lab') {
            getKaTimPengujian();
        }
    }, [tipeBarang]);

    // UNTUK SCAN QR CODE
    const handleScanQrCode = (value: string) => {
        api
            .post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-barang-by-qrcode`,
                { text: value }
            )
            .then((res) => {
                const data = res.data;

                // CEK APAKAH DATA TIDAK KOSONG ATAU BUKAN OBJECT
                if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                    if (listBarang.some((b: any) => b.kode === data.kode && b.nup === data.nup)) {
                        alert("Barang ini sudah ada dalam listBarang");
                        return;
                    }

                    setDaftar([
                        ...listBarang,
                        {
                            id: data.id,
                            kode: data.kode,
                            nup: data.nup,
                            nama: data.nama,
                            merk: data.merk,
                            keluhan: "",
                        },
                    ]);

                    setKodeBarang("");
                    setNup("");
                } else {
                    alert("Barang tidak ditemukan");
                }
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                console.log(err);
            });
    };

    // UNTUK INPUT MANUAL KODE BARANG DAN NUP
    const handleInput = () => {
        api
            .post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-barang-by-kode-nup`,
                { kode: kodeBarang, nup: nup }
            )
            .then((res) => {
                const data = res.data;
                // CEK APAKAH DATA TIDAK KOSONG ATAU BUKAN OBJECT
                if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                    if (listBarang.some((b: any) => b.kode === data.kode && b.nup === data.nup)) {
                        alert("Barang ini sudah ada dalam listBarang");
                        return;
                    }

                    setDaftar([
                        ...listBarang,
                        {
                            id: data.id,
                            kode: data.kode,
                            nup: data.nup,
                            nama: data.nama,
                            merk: data.merk,
                            keluhan: "",
                        },
                    ]);

                    setKodeBarang("");
                    setNup("");
                } else {
                    alert("Barang tidak ditemukan");
                }
            })
            .catch((err) => {
                alert("Terjadi kesalahan saat mengirim data ke API");
                console.log(err);
            });
    };

    const updateKeluhan = (i: number, value: string) => {
        const salin = [...listBarang];
        salin[i].keluhan = value;
        setDaftar(salin);
    };

    const removeItem = (i: number) => {
        setDaftar(listBarang.filter((_: any, idx: number) => idx !== i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tipeBarang === 'lab' && !kaTimPengujianId) {
            alert("Silakan pilih KaTim Pengujian terlebih dahulu.");
            return;
        }

        if (listBarang.length === 0) return alert("Belum ada barang yang diajukan");

        const adaKosong = listBarang.some((item: any) => {
            return !item.keluhan || item.keluhan.trim() === "";
        });

        if (adaKosong) {
            const itemKosong = listBarang.find((item: any) => !item.keluhan || item.keluhan.trim() === "");
            alert(`Keluhan untuk barang ${itemKosong.nama} dengan Kode: ${itemKosong.kode} NUP: ${itemKosong.nup} belum diisi`);
            return; // <-- ini menghentikan handleSubmit
        }

        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/store-new-pemeliharaan`,
            {
                tipeBarang,
                listBarang,
                note,
                fungsiId: user?.employee?.fungsi_id,
                disposisiToId: tipeBarang !== 'lab' ? kaTu?.user_id : kaTimPengujianId,
            }
        ).then((res) => {
            dispatch(showAlert({ type: "success", message: res.data.message || "Berhasil mengajukan pemeliharaan BMN", description: res.data.message || "Berhasil mengajukan pemeliharaan BMN" }));
            setDaftar([]);
            router.push('/simpel-bmn/pemeliharaan');
        }).catch((err) => {
            dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
            console.log(err);
        });
    };


    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="md:text-2xl font-semibold text-center">Form Pemeliharaan BMN</h1>

            <div className="space-y-2 mb-10">
                <div className="mb-6 flex gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Tipe Barang
                        </label>
                        <select
                            name="role_id"
                            value={tipeBarang}
                            onChange={(e) => setSetTipeBarang(e.target.value)}
                            required
                            className="ar-input-text-purple"
                        >
                            {listTipeBarang.map((tipeBarang, index) => (
                                <option key={index} value={tipeBarang} disabled={tipeBarang === 'non-bmn'}>
                                    {tipeBarang.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {
                        tipeBarang === 'lab' &&
                        <div>
                            <label className="block text-sm font-medium text-gray-700 ar-label-required">
                                Katim Pengujian
                            </label>
                            <select
                                name="katim_pengujian_id"
                                value={kaTimPengujianId}
                                onChange={(e) => setKaTimPengujianId(e.target.value)}
                                required
                                className="ar-input-text-purple"
                            >
                                <option value="">-- Pilih Katim Pengujian --</option>
                                {listKaTimPengujian.map((kaTimPengujian, index) => (
                                    <option key={index} value={kaTimPengujian.user_id}>
                                        {kaTimPengujian.user.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    }
                </div>

                <div className="flex gap-2 flex-col md:flex-row">
                    {/* Input Kode + NUP */}
                    <div className="flex gap-4 items-end flex-1">
                        <div className="flex-1">
                            {/* <label className="block text-sm">Kode Barang</label> */}
                            <input
                                type="text"
                                value={kodeBarang}
                                onChange={(e) => setKodeBarang(e.target.value)}
                                className="ar-input-text-purple w-full"
                                placeholder="Kode Barang"
                                autoFocus
                            />
                        </div>

                        <div>
                            {/* <label className="block text-sm">NUP</label> */}
                            <input
                                placeholder="NUP"
                                maxLength={4}
                                type="number"
                                value={nup}
                                onChange={(e) => setNup(e.target.value)}
                                className="ar-input-text-purple w-20"
                            />
                        </div>

                        <button onClick={handleInput} className="btn btn-primary">INPUT</button>
                    </div>

                    <button onClick={handleInputQrCode} className="btn btn-accent flex justify-center items-center gap-2">
                        INPUT BY SCAN QRCODE BMN
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                    </button>
                </div>

                <QRScannerModal
                    open={openScanner}
                    onClose={() => setOpenScanner(false)}
                    onScan={handleScanQrCode}
                />
            </div>

            {/* Daftar Barang Diajukan */}
            {listBarang.length > 0 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <table className="table table-zebra w-full text-sm">
                        <thead>
                            <tr>
                                <th>Kode</th>
                                <th>NUP</th>
                                <th>Nama</th>
                                <th>Keluhan</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {listBarang.map((item: any, i: number) => (
                                <tr key={i}>
                                    <td>{item.kode}</td>
                                    <td>{item.nup}</td>
                                    <td>{item.nama}</td>
                                    <td>
                                        <input
                                            className="ar-input-text-purple w-full"
                                            value={item.keluhan}
                                            onChange={(e) => updateKeluhan(i, e.target.value)}
                                        />
                                    </td>
                                    <td>
                                        <button type="button" className="btn btn-ghost" onClick={() => removeItem(i)}>
                                            <span className="material-symbols-outlined text-red-500">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <textarea className="ar-input-text-purple w-full h-20 mt-10"
                        placeholder={`Catatan untuk ${tipeBarang === 'lab' ? 'Katim Pengujian' : 'KaTu'}`}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}></textarea>

                    <button className="btn btn-primary w-full">SUBMIT</button>
                </form>
            )}
        </div>
    );
}
