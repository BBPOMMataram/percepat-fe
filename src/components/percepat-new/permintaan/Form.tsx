"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import FormPerlengkapanKebersihan from "./FormPerlengkapanKebersihan";
import FormReagen from "./FormReagen";

export default function FormPemeliharaanSimpelBmn() {
    const [listBarang, setListBarang] = useState<any[]>([]);
    const { user } = useSelector((state: RootState) => state.auth);
    const [jenisBarang, setSetTipeBarang] = useState("reagen"); // u menentukan end point saja, ga dikirim sbg payload
    const [listKaTim, setListKaTim] = useState<any[]>([]);
    const [katimId, setKaTimId] = useState<any>("");
    const [tanggal, setTanggal] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const listJenisBarang = [
        'reagen', 'atk', 'baku pembanding', 'suku cadang', 'perlengkapan kebersihan'
    ];

    const getKaTim = async () => {
        try {
            const [katimRes, katuRes] = await Promise.all([
                api(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-katim`),
                api(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-katu`)
            ]);

            const katim = katimRes.data; // array
            const katu = katuRes.data;   // object

            const merged = [...katim, katu]; // ⬅️ katu juga sebagai katim tu

            setListKaTim(merged.reverse());
            // console.log('merged', merged);

        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        getKaTim();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (listBarang.length === 0) return alert("Belum ada barang yang diajukan");

        if (!katimId) {
            alert("Silahkan pilih KaTim terlebih dahulu.");
            return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT;
        if (!baseUrl) {
            console.log("Konfigurasi .env tidak ditemukan (NEXT_PUBLIC_BACKEND_URL_PERCEPAT).");
            return;
        }

        let url = baseUrl;
        let redirectUrlAfterSubmit = '';
        switch (jenisBarang) {
            case 'reagen':
                url += `/api/v1/permintaan-reagen`;
                redirectUrlAfterSubmit = '/percepat-new/permintaan/reagen';
                break;
            case 'atk':
                // endpoint atk
                break;
            case 'baku pembanding':
                // endpoint baku pembanding
                break;
            case 'suku cadang':
                // endpoint suku cadang
                break;
            case 'perlengkapan kebersihan':
                url += `/api/v1/permintaan-perlengkapan-kebersihan`;
                redirectUrlAfterSubmit = '/percepat-new/permintaan/perlengkapan-kebersihan';
                break;
            default:
                alert("Jenis barang tidak valid.");
                return;
        }

        setIsSubmitting(true);
        api.post(url, { jenisBarang, listBarang, pemohon: user, katimId, createdAt: tanggal }
        ).then((res) => {
            dispatch(showAlert({ type: "success", message: res.data.message || `Berhasil mengajukan Permintaan ${jenisBarang}`, description: res.data.message || "Berhasil mengajukan permintaan" }));
            setListBarang([]);
            router.push(redirectUrlAfterSubmit);
            setIsSubmitting(false);
        }).catch((err) => {
            // GUNAKAN SHOW ERROR ALERT INI NANTI UNTUK SEMUA CATCH ERROR DI PROYEK INI
            dispatch(showAlert({ type: "error", message: err?.response?.data?.message || err.message, description: err.response?.data?.message || "No Message from Backend" }));
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
                            {listJenisBarang.map((jb, index) => {
                                const isAllowed = ['reagen', 'perlengkapan kebersihan'].includes(jb.toLowerCase().trim());
                                return (
                                    <option key={index} value={jb} disabled={!isAllowed}>
                                        {jb.toUpperCase()}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Katim
                        </label>
                        <select
                            name="katim_id"
                            value={katimId}
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
                    {/* {jenisBarang === 'atk' && (
                        <FormAtk listBarang={listBarang} setListBarang={setListBarang} />
                        )}
                        {jenisBarang === 'baku pembanding' && (
                            <FormBakuPembanding listBarang={listBarang} setListBarang={setListBarang} />
                            )}
                            {jenisBarang === 'suku cadang' && (
                                <FormSukuCadang listBarang={listBarang} setListBarang={setListBarang} />
                                )} */}
                    {jenisBarang === 'perlengkapan kebersihan' && (
                        <FormPerlengkapanKebersihan listBarang={listBarang} setListBarang={setListBarang} />
                    )}

                    {/* CATATAN */}
                    {/* <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catatan
                        </label>
                        <textarea
                            className="ar-input-text-purple w-full h-24 resize-none"
                            placeholder="Tambahkan catatan jika diperlukan..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div> */}

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

