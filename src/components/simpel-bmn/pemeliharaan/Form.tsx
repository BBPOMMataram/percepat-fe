"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FormNonBmn from "./FormNonBmn";
import { ModalWebcamInputBarang } from "./ModalWebcamInputBarang";
import QRScannerModal from "./QRScannerModal";

export default function FormPemeliharaanSimpelBmn() {
    const [kodeBarang, setKodeBarang] = useState("");
    const [nup, setNup] = useState("");
    const [listBarang, setListBarang] = useState<any>([]);
    const [openScanner, setOpenScanner] = useState(false);
    const { user } = useSelector((state: RootState) => state.auth);
    const [tipeBarang, setTipeBarang] = useState("non-lab");
    const [kaTu, setKaTu] = useState<any>({});
    const [listKaTimPengujian, setListKaTimPengujian] = useState<any[]>([]);
    const [kaTimPengujianId, setKaTimPengujianId] = useState<any>("");
    const [listKaTim, setListKaTim] = useState<any[]>([]);
    const [kaTimId, setKaTimId] = useState<any>("");
    const [note, setNote] = useState<string>("");
    const [webcamIndex, setWebcamIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

    const getKaTim = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-katim`
        ).then((res) => {
            setListKaTim(res.data);
        })
    }

    useEffect(() => {
        getKaTu();

        if (tipeBarang === 'lab') {
            getKaTimPengujian();
        } else {
            getKaTim();
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

                    setListBarang([
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

                    setListBarang([
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
        setListBarang(salin);
    };

    const updateBukti = (index: number, file: File | null) => {
        setListBarang((prev: any) => {
            const clone = [...prev];
            clone[index] = { ...clone[index], bukti: file };
            return clone;
        });
    };

    const removeItem = (i: number) => {
        setListBarang(listBarang.filter((_: any, idx: number) => idx !== i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (tipeBarang === 'lab' && !kaTimPengujianId) {
            alert("Silahkan pilih KaTim Pengujian terlebih dahulu.");
            return;
        }

        if (tipeBarang !== 'lab' && user?.employee?.fungsi_id !== 1 && user?.employee?.group_jabatan?.id !== 3 && !kaTimId) {
            alert("Silahkan pilih KaTim terlebih dahulu.");
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

        setIsSubmitting(true);
        let disposisiToId = null;

        // JIKA BUKAN BARANG LAB MAKA DISPO KE KATIM (UNTUK SELAIN TU) ATAU KATU (UNTUK TU ATAU KATIM SENDIRI)
        // JIKA BARANG LAB MAKA DISPO KE KATIM PENGUJIAN
        if (tipeBarang !== 'lab') {
            if (user?.employee?.fungsi_id !== 1 && user?.employee?.group_jabatan?.id !== 3) {
                disposisiToId = kaTimId;
            } else {
                disposisiToId = kaTu?.user_id;
            }
        } else {
            disposisiToId = kaTimPengujianId;
        }
        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/store-new-pemeliharaan`,
            {
                tipeBarang,
                listBarang,
                note,
                fungsiId: user?.employee?.fungsi_id,
                disposisiToId,
            },
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        ).then((res) => {
            dispatch(showAlert({ type: "success", message: res.data.message || "Berhasil mengajukan pemeliharaan BMN", description: res.data.message || "Berhasil mengajukan pemeliharaan BMN" }));
            setListBarang([]);
            router.push('/simpel-bmn/pemeliharaan');
            setIsSubmitting(false);
        }).catch((err) => {
            dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
            console.log(err);
            setIsSubmitting(false);
        });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="md:text-2xl font-semibold text-center">Form Pemeliharaan BMN</h1>

            <div className="space-y-2 mb-10">
                {/* TIPE BARANG */}
                <div className="mb-6 flex gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Tipe Barang
                        </label>
                        <select
                            name="role_id"
                            value={tipeBarang}
                            onChange={(e) => setTipeBarang(e.target.value)}
                            required
                            className="ar-input-text-purple"
                        >
                            {listTipeBarang.map((tipeBarang, index) => {
                                let labelTipeBarang = ''

                                switch (tipeBarang) {
                                    case 'lab':
                                        labelTipeBarang = 'BMN (ALAT LAB)';
                                        break;
                                    case 'non-lab':
                                        labelTipeBarang = 'BMN (NON ALAT LAB)';
                                        break;
                                    case 'non-bmn':
                                        labelTipeBarang = 'NON BMN';
                                        break;
                                    default:
                                        labelTipeBarang = tipeBarang.toUpperCase();
                                }

                                return <option key={index} value={tipeBarang}>
                                    {labelTipeBarang}
                                </option>
                            })}
                        </select>
                    </div>

                    {
                        tipeBarang === 'lab' ?
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
                            :
                            ( // HARUS PILIH KATIM
                                user?.employee?.fungsi_id !== 1 // KECUALI FUNGSI TU
                                && // ATAU
                                user?.employee?.group_jabatan?.id !== 3 // KECUALI GROUP JABATAN KATIM
                            )
                                ?
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 ar-label-required">
                                        Katim
                                    </label>
                                    <select
                                        name="katim_id"
                                        value={kaTimId}
                                        onChange={(e) => setKaTimId(e.target.value)}
                                        required
                                        className="ar-input-text-purple"
                                    >
                                        <option value="">-- Pilih Katim --</option>
                                        {listKaTim.map((kaTim, index) => (
                                            <option key={index} value={kaTim.user_id}>
                                                {kaTim.user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                : null
                    }
                </div>

                {tipeBarang !== 'non-bmn' ?
                    <>
                        {/* INPUT BARANG LAB / NON-LAB */}
                        <div className="mb-6 flex gap-2 flex-col md:flex-row">
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

                            <QRScannerModal
                                open={openScanner}
                                onClose={() => setOpenScanner(false)}
                                onScan={handleScanQrCode}
                            />
                        </div>

                        {/* LIST BARANG LAB / NON LAB YANG DIAJUKAN */}
                        {listBarang.length > 0 && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="overflow-auto">
                                    <table className="table table-zebra w-full text-sm">
                                        <thead>
                                            <tr>
                                                <th>Kode</th>
                                                <th>NUP</th>
                                                <th>Nama</th>
                                                <th>Keluhan</th>
                                                <th>Bukti</th>
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
                                                    <td className="flex items-center gap-2">

                                                        {/* FILE INPUT */}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            className="ar-input-text-purple w-22"
                                                            onChange={(e) => updateBukti(i, e.target.files?.[0] || null)}
                                                        />

                                                        {/* BUTTON BUKA MODAL WEBCAM */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setWebcamIndex(i)}
                                                            className="btn btn-ghost btn-circle"
                                                        >
                                                            <span className="material-symbols-outlined">photo_camera</span>
                                                        </button>
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
                                </div>
                                <textarea className="ar-input-text-purple w-full h-20 mt-10"
                                    placeholder={`Catatan`}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}></textarea>

                                <div className="flex w-full justify-end">
                                    <button className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} type="submit" disabled={isSubmitting}>SUBMIT</button>
                                </div>
                            </form>
                        )}
                    </>
                    :
                    // KaTimId dikirim untuk validasi di FormNonBmn
                    <FormNonBmn user={user} kaTu={kaTu} kaTimId={kaTimId} />

                }

            </div>

            {webcamIndex !== null && (
                <ModalWebcamInputBarang
                    index={webcamIndex}
                    updateBukti={updateBukti}
                    onClose={() => setWebcamIndex(null)}
                />
            )}
        </div>
    );
}
