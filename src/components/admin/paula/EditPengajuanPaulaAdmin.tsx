"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";
import api from "@/utils/axios";
import { toast } from "react-toastify";
import Link from "next/link";

export default function EditPengajuanPaulaAdmin() {
    const params = useParams();
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);

    const id = params?.id;
    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({ max_booking_days: 7, max_peserta_besar: 100, max_peserta_kecil: 50 });

    const [formData, setFormData] = useState({
        nama_kegiatan: "",
        tanggal_pinjam: "",
        aula: "besar",
        waktu_mulai: "",
        waktu_selesai: "",
        pilihan: "Internal",
        peserta: "",
        jumlah_peserta: "",
        penanggung_jawab: "",
    });

    const [sarana, setSarana] = useState<string[]>([]);
    const [customSaranaInput, setCustomSaranaInput] = useState("");
    const [isTimeConflict, setIsTimeConflict] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");
    const opsiSarana = ["Proyektor", "Kamera", "Zoom Meeting", "Sound System"];

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (authLoading === false && !user) {
            router.push(`/login?redirectUrl=/paula/admin/dashboard`);
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const [resSet, resPengajuan] = await Promise.all([
                    api.get(`${baseURL}/api/paula/settings`),
                    api.get(`${baseURL}/api/paula/admin/pengajuan/${id}`),
                ]);

                setSettings(resSet.data);

                const p = resPengajuan.data.pengajuan;
                let parsedSarana: string[] = [];
                try {
                    parsedSarana = typeof p.sarana_prasarana === "string" ? JSON.parse(p.sarana_prasarana) : (p.sarana_prasarana || []);
                } catch {
                    parsedSarana = [];
                }

                setFormData({
                    nama_kegiatan: p.nama_kegiatan || "",
                    tanggal_pinjam: p.tanggal_pinjam ? p.tanggal_pinjam.split("T")[0] : "",
                    aula: p.aula || "besar",
                    waktu_mulai: p.waktu_mulai ? p.waktu_mulai.slice(0, 5) : "",
                    waktu_selesai: p.waktu_selesai ? p.waktu_selesai.slice(0, 5) : "",
                    pilihan: p.pilihan || "Internal",
                    peserta: p.peserta || "",
                    jumlah_peserta: p.jumlah_peserta ? String(p.jumlah_peserta) : "",
                    penanggung_jawab: p.penanggung_jawab || "",
                });
                setSarana(parsedSarana);
            } catch (err) {
                console.error(err);
                toast.error("Gagal memuat data pengajuan");
                router.push("/paula/admin/dashboard");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            const isSuperadmin = user.role?.level === "superadmin";
            const isAdmin = user.role?.level === "admin";
            if (!isAdmin && !isSuperadmin) {
                router.replace("/unauthorized");
            } else {
                fetchInitialData();
            }
        }
    }, [id, user, baseURL, router]);

    const checkTimeAvailability = async (mulai: string, selesai: string, tanggal: string, aula: string) => {
        if (!mulai || !selesai || !tanggal || !aula || !id) return;
        if (selesai <= mulai) {
            setIsTimeConflict(true);
            setConflictMessage("Waktu selesai harus setelah waktu mulai.");
            return;
        }
        try {
            const res = await api.get(`${baseURL}/api/paula/check-time`, {
                params: { tanggal, waktu_mulai: mulai, waktu_selesai: selesai, aula, exclude_id: id }
            });
            if (!res.data.valid) {
                setIsTimeConflict(true);
                setConflictMessage(res.data.message);
            } else {
                setIsTimeConflict(false);
                setConflictMessage("");
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (formData.waktu_selesai && formData.waktu_mulai && formData.tanggal_pinjam && formData.aula && !isLoading) {
            checkTimeAvailability(formData.waktu_mulai, formData.waktu_selesai, formData.tanggal_pinjam, formData.aula);
        } else {
            setIsTimeConflict(false);
            setConflictMessage("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.waktu_selesai, formData.waktu_mulai, formData.tanggal_pinjam, formData.aula, isLoading]);

    const handleAddCustomSarana = () => {
        if (customSaranaInput.trim() && !sarana.includes(customSaranaInput.trim())) {
            setSarana([...sarana, customSaranaInput.trim()]);
            setCustomSaranaInput("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isTimeConflict) {
            return toast.error("Waktu dan tempat bertabrakan dengan pemesanan lain!");
        }

        const maxAllowed = formData.aula === "besar" ? settings.max_peserta_besar : settings.max_peserta_kecil;
        if (parseInt(formData.jumlah_peserta) > maxAllowed) {
            return toast.error(`Kapasitas maksimal aula ${formData.aula} adalah ${maxAllowed} orang!`);
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                sarana_prasarana: sarana,
            };
            await api.put(`${baseURL}/api/paula/admin/pengajuan/${id}`, payload);
            toast.success("Pengajuan berhasil diperbarui oleh admin");
            router.push("/paula/admin/dashboard");
        } catch (error: any) {
            const errMsg = error.response?.data?.message || "Gagal memperbarui pengajuan";
            toast.error(errMsg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Edit Pengajuan Aula (Admin)</h1>
                    <p className="text-slate-500 text-sm mt-1">Perbarui jadwal atau detail peminjaman aula BPOM.</p>
                </div>
                <Link
                    href="/paula/admin/dashboard"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span> Kembali
                </Link>
            </div>

            {isTimeConflict && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {conflictMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-5">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Kegiatan</label>
                    <input
                        type="text"
                        required
                        value={formData.nama_kegiatan}
                        onChange={e => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Tanggal Pelaksanaan</label>
                        <input
                            type="date"
                            required
                            value={formData.tanggal_pinjam}
                            onChange={e => setFormData({ ...formData, tanggal_pinjam: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Pilihan Aula</label>
                        <select
                            required
                            value={formData.aula}
                            onChange={e => setFormData({ ...formData, aula: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                        >
                            <option value="besar">Aula Besar (Maks. {settings.max_peserta_besar} orang)</option>
                            <option value="kecil">Aula Kecil (Maks. {settings.max_peserta_kecil} orang)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Waktu Mulai</label>
                        <input
                            type="time"
                            required
                            value={formData.waktu_mulai}
                            onChange={e => setFormData({ ...formData, waktu_mulai: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Waktu Selesai</label>
                        <input
                            type="time"
                            required
                            value={formData.waktu_selesai}
                            onChange={e => setFormData({ ...formData, waktu_selesai: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Narasumber</label>
                        <select
                            required
                            value={formData.pilihan}
                            onChange={e => setFormData({ ...formData, pilihan: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                        >
                            <option value="Internal">Internal</option>
                            <option value="Eksternal">Eksternal</option>
                            <option value="Internal & Eksternal">Internal & Eksternal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Asal Peserta</label>
                        <input
                            type="text"
                            required
                            value={formData.peserta}
                            onChange={e => setFormData({ ...formData, peserta: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                            placeholder="Instansi/Asal Peserta..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Jumlah Peserta</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.jumlah_peserta}
                            onChange={e => setFormData({ ...formData, jumlah_peserta: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Penanggung Jawab</label>
                        <input
                            type="text"
                            required
                            value={formData.penanggung_jawab}
                            onChange={e => setFormData({ ...formData, penanggung_jawab: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-slate-800"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Sarana & Prasarana</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {opsiSarana.map(item => (
                            <label
                                key={item}
                                className={`px-3 py-1.5 border rounded-full text-xs font-bold cursor-pointer transition ${sarana.includes(item) ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={sarana.includes(item)}
                                    onChange={() => setSarana(p => p.includes(item) ? p.filter(i => i !== item) : [...p, item])}
                                />
                                {item}
                            </label>
                        ))}
                        {sarana.filter(s => !opsiSarana.includes(s)).map(customItem => (
                            <span
                                key={customItem}
                                className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5"
                            >
                                {customItem}
                                <button
                                    type="button"
                                    onClick={() => setSarana(sarana.filter(s => s !== customItem))}
                                    className="hover:text-rose-600 font-bold"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Tambah sarana lainnya..."
                            value={customSaranaInput}
                            onChange={e => setCustomSaranaInput(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                        />
                        <button
                            type="button"
                            onClick={handleAddCustomSarana}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                            Tambah
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                    <Link
                        href="/paula/admin/dashboard"
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving || isTimeConflict}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer text-sm flex items-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span> Menyimpan...
                            </>
                        ) : (
                            "Simpan Perubahan"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
