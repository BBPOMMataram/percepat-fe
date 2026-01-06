"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FormAtk from "./FormAtk";
import FormBakuPembanding from "./FormBakuPembanding";
import FormReagen from "./FormReagen";
import FormSukuCadang from "./FormSukuCadang";
import dayjs from "dayjs";

export default function FormPemeliharaanSimpelBmn() {
    const [listBarang, setListBarang] = useState<any[]>([]);
    const { user } = useSelector((state: RootState) => state.auth);
    const [jenisBarang, setSetTipeBarang] = useState("reagen"); // u menentukan end point saja, ga dikirim sbg payload
    const [kaTu, setKaTu] = useState<any>({});
    const [listKaTimPengujian, setListKaTimPengujian] = useState<any[]>([]);
    const [kaTimPengujianId, setKaTimPengujianId] = useState<any>("");
    const [listKaTim, setListKaTim] = useState<any[]>([]);
    const [kaTimId, setKaTimId] = useState<any>("");
    const [note, setNote] = useState<string>("");
    const [tanggal, setTanggal] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();


    const listJenisBarang = [
        'reagen', 'atk', 'bakuPembanding', 'sukuCadang'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (listBarang.length === 0) return alert("Belum ada barang yang diajukan");

        setIsSubmitting(true);
        let disposisiToId = null;

        // DISPO


        console.log({ jenisBarang, listBarang, note, disposisiToId, pemohon: user });

        return

        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/store-new-pemeliharaan`,
            {
                jenisBarang,
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
            <h1 className="md:text-2xl font-semibold text-center">Form Permintaan Inventaris</h1>

            <div className="space-y-2 mb-10">
                {/* TIPE BARANG */}
                <div className="mb-6 flex gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Jenis Barang
                        </label>
                        <select
                            name="role_id"
                            value={jenisBarang}
                            onChange={(e) => setSetTipeBarang(e.target.value)}
                            required
                            className="ar-input-text-purple"
                        >
                            {listJenisBarang.map((jenisBarang, index) => (
                                <option key={index} value={jenisBarang}>
                                    {jenisBarang.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="ml-auto">
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Tanggal
                        </label>
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            required
                            className="ar-input-text-purple"
                        />
                    </div>
                </div>

                <>
                    {/* FORM PERMINTAAN */}
                    {jenisBarang === 'reagen' && (
                        <FormReagen listBarang={listBarang} setListBarang={setListBarang} />
                    )}
                    {jenisBarang === 'atk' && (
                        <FormAtk listBarang={listBarang} setListBarang={setListBarang} />
                    )}
                    {jenisBarang === 'bakuPembanding' && (
                        <FormBakuPembanding listBarang={listBarang} setListBarang={setListBarang} />
                    )}
                    {jenisBarang === 'sukuCadang' && (
                        <FormSukuCadang listBarang={listBarang} setListBarang={setListBarang} />
                    )}

                    {/* CATATAN */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan
                        </label>
                        <textarea
                            className="ar-input-text-purple w-full h-24 resize-none"
                            placeholder="Tambahkan catatan jika diperlukan..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || listBarang.length === 0}
                            className={`w-full py-3 px-4 rounded font-semibold ${isSubmitting || listBarang.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                        >
                            {isSubmitting ? 'Mengirim...' : 'Ajukan Permintaan'}
                        </button>
                    </div>

                    {/* LIST BARANG YANG DIAJUKAN */}

                </>

            </div>

        </div>
    );
}

