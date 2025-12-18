import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { ModalWebcamInputBarang } from "./ModalWebcamInputBarang";

export default function FormNonBmn({ user, kaTu }: { user: any, kaTu: any }) {
    const [listBarang, setListBarang] = useState<any>([]);
    const [namaBarang, setNamaBarang] = useState("");
    const [merkBarang, setMerkBarang] = useState("");
    const [lokasiBarang, setLokasiBarang] = useState("");
    const [webcamIndex, setWebcamIndex] = useState<number | null>(null);
    const [note, setNote] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const handleInput = () => {
        if (!namaBarang || !merkBarang || !lokasiBarang) {
            alert('Lengkapi form terlebih dahulu');
            return;
        }

        if (listBarang.some((b: any) => b.namaBarang === namaBarang)) {
            alert("Nama barang sudah diinput");
            return;
        }

        setListBarang([
            ...listBarang,
            {
                namaBarang,
                merkBarang,
                lokasiBarang,
                keluhan: "",
            },
        ]);
    }

    const handleSubmit = (e: any) => {
        e.preventDefault();

        if (listBarang.length === 0) return alert("Belum ada barang yang diajukan");

        const adaKosong = listBarang.some((item: any) => {
            return !item.keluhan || item.keluhan.trim() === "";
        });

        if (adaKosong) {
            const itemKosong = listBarang.find((item: any) => !item.keluhan || item.keluhan.trim() === "");
            alert(`Keluhan untuk barang ${itemKosong.namaBarang} belum diisi`);
            return; // <-- ini menghentikan handleSubmit
        }

        setIsSubmitting(true);
        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/store-new-pemeliharaan-nonbmn`,
            {
                tipeBarang: 'non-bmn',
                listBarang,
                note,
                fungsiId: user?.employee?.fungsi_id,
                disposisiToId: kaTu?.user_id,
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
    }

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

    return (
        <>
            <div className="mb-6 flex gap-2 flex-col md:flex-row">
                <div className="flex gap-4 items-end flex-1">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={namaBarang}
                            onChange={(e) => setNamaBarang(e.target.value)}
                            className="ar-input-text-purple w-full"
                            placeholder="Nama Barang"
                            autoFocus
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={merkBarang}
                            onChange={(e) => setMerkBarang(e.target.value)}
                            className="ar-input-text-purple w-full"
                            placeholder="Merk Barang"
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={lokasiBarang}
                            onChange={(e) => setLokasiBarang(e.target.value)}
                            className="ar-input-text-purple w-full"
                            placeholder="Lokasi Barang"
                        />
                    </div>

                    <button onClick={handleInput} className="btn btn-primary">INPUT</button>
                </div>
            </div>

            {listBarang.length > 0 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="overflow-auto">
                        <table className="table table-zebra w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Nama Barang</th>
                                    <th>Merk Barang</th>
                                    <th>Keluhan</th>
                                    <th>Bukti</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {listBarang.map((item: any, i: number) => (
                                    <tr key={i}>
                                        <td>{item.namaBarang}</td>
                                        <td>{item.merkBarang}</td>
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

            {webcamIndex !== null && (
                <ModalWebcamInputBarang
                    index={webcamIndex}
                    updateBukti={updateBukti}
                    onClose={() => setWebcamIndex(null)}
                />
            )}
        </>
    )
}