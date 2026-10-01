/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { toast } from "react-toastify";
import Link from "next/link";

export default function PaulaUserDashboard() {
    const [pengajuans, setPengajuans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [settings, setSettings] = useState({ max_booking_days: 7, max_peserta_besar: 100, max_peserta_kecil: 50 });

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        nama_kegiatan: "",
        tanggal_pinjam: "",
        aula: "",
        waktu_mulai: "",
        waktu_selesai: "",
        pilihan: "",
        peserta: "",
        jumlah_peserta: "",
        penanggung_jawab: ""
    });

    const [isTimeConflict, setIsTimeConflict] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");

    const [sarana, setSarana] = useState<string[]>([]);
    const [customSaranaInput, setCustomSaranaInput] = useState("");
    const opsiSarana = ["Proyektor", "Kamera", "Zoom Meeting", "Sound System"];

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA || 'http://localhost:8000';

    const fetchUserPengajuan = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`${baseURL}/api/paula/user/dashboard`);
            setPengajuans(res.data.pengajuans);
        } catch (error) {
            toast.error("Gagal mengambil riwayat pengajuan");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserPengajuan();
        api.get(`${baseURL}/api/paula/settings`).then(res => setSettings(res.data)).catch(console.error);
    }, [baseURL]);

    const handleRequestEdit = async (id: number) => {
        if (!confirm("Ajukan permintaan izin edit ke Admin?")) return;
        try {
            await api.post(`${baseURL}/api/paula/user/edit-request/${id}`);
            toast.success("Permintaan edit berhasil dikirim ke Admin");
            fetchUserPengajuan();
        } catch (error) {
            toast.error("Gagal mengirim permintaan edit");
        }
    };

    const checkTimeAvailability = async (mulai: string, selesai: string, tanggal: string, aula: string, excludeId: number | null) => {
        if (!mulai || !selesai || !tanggal || !aula) return;
        
        if (selesai <= mulai) {
            setIsTimeConflict(true);
            setConflictMessage("Waktu selesai harus setelah waktu mulai.");
            return;
        }

        try {
            const res = await api.get(`${baseURL}/api/paula/check-time`, {
                params: { tanggal, waktu_mulai: mulai, waktu_selesai: selesai, aula, exclude_id: excludeId }
            });
            if (!res.data.valid) {
                setIsTimeConflict(true);
                setConflictMessage(res.data.message);
            } else {
                setIsTimeConflict(false);
                setConflictMessage("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (editModalOpen && formData.waktu_selesai && formData.waktu_mulai && formData.tanggal_pinjam && formData.aula) {
            checkTimeAvailability(formData.waktu_mulai, formData.waktu_selesai, formData.tanggal_pinjam, formData.aula, selectedId);
        } else {
            setIsTimeConflict(false);
            setConflictMessage("");
        }
    }, [formData.waktu_selesai, formData.waktu_mulai, formData.tanggal_pinjam, formData.aula, editModalOpen, selectedId]);

    const maxAllowedPeserta = formData.aula === 'besar' ? settings.max_peserta_besar : settings.max_peserta_kecil;
    const isOverCapacity = formData.aula && parseInt(formData.jumlah_peserta) > maxAllowedPeserta;

    const handleOpenEditModal = (p: any) => {
        setSelectedId(p.id);
        let parsedSarana: string[] = [];
        try { parsedSarana = JSON.parse(p.sarana_prasarana || '[]'); } catch (e) {}

        setFormData({
            nama_kegiatan: p.nama_kegiatan || "",
            tanggal_pinjam: p.tanggal_pinjam?.split('T')[0] || "",
            aula: p.aula || "",
            waktu_mulai: p.waktu_mulai?.slice(0,5) || "",
            waktu_selesai: p.waktu_selesai?.slice(0,5) || "",
            pilihan: p.pilihan || "",
            peserta: p.peserta || "",
            jumlah_peserta: p.jumlah_peserta || "",
            penanggung_jawab: p.penanggung_jawab || ""
        });
        setSarana(parsedSarana);
        setIsTimeConflict(false);
        setConflictMessage("");
        setEditModalOpen(true);
    };

    const handleAddCustomSarana = () => {
        if (customSaranaInput.trim() && !sarana.includes(customSaranaInput.trim())) {
            setSarana([...sarana, customSaranaInput.trim()]);
            setCustomSaranaInput("");
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return;
        if (isTimeConflict) return toast.error("Waktu dan tempat bertabrakan dengan pemesanan lain!");
        if (isOverCapacity) return toast.error(`Kapasitas maksimal aula ${formData.aula} adalah ${maxAllowedPeserta} orang!`);

        setIsSaving(true);
        try {
            const payload = { ...formData, sarana_prasarana: sarana };
            await api.put(`${baseURL}/api/paula/pengajuan/${selectedId}`, payload);
            toast.success("Pengajuan berhasil diperbarui!");
            setEditModalOpen(false);
            fetchUserPengajuan();
        } catch (error) {
            toast.error("Gagal memperbarui pengajuan.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDismissNotification = async (id: number) => {
        try {
            await api.patch(`${baseURL}/api/paula/user/dismiss-notification/${id}`);
            fetchUserPengajuan();
        } catch (error) {
            toast.error("Gagal menghapus notifikasi");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Batalkan/hapus pengajuan ini?")) return;
        try {
            await api.delete(`${baseURL}/api/paula/user/pengajuan/${id}`);
            toast.success("Pengajuan dihapus");
            fetchUserPengajuan();
        } catch (error) {
            toast.error("Gagal menghapus pengajuan");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    return (
        <div className="max-w-screen-xl mx-auto animate-in fade-in duration-500 pb-16 px-4 md:px-8">
            <div className="mb-8 mt-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Riwayat Pengajuan Saya</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Kelola dan pantau status peminjaman aula yang Anda ajukan.</p>
                </div>
                <Link href="/paula/aula/pengajuan" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span> Buat Pengajuan Baru
                </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                                <th className="px-6 py-4">Tgl Pengajuan</th>
                                <th className="px-6 py-4">Nama Kegiatan</th>
                                <th className="px-6 py-4">Pelaksanaan</th>
                                <th className="px-6 py-4">Aula</th>
                                <th className="px-6 py-4">Status & Keterangan</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {pengajuans.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{p.nama_kegiatan}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold text-slate-800">{new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</div>
                                        <div className="text-xs text-blue-600 font-bold mt-0.5">{p.waktu_mulai.slice(0,5)} - {p.waktu_selesai.slice(0,5)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${p.aula === 'besar' ? 'bg-indigo-100 text-indigo-700' : 'bg-pink-100 text-pink-700'}`}>
                                            {p.aula}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.is_approved ? (
                                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold inline-block">Disetujui</span>
                                        ) : p.edit_reject_reason ? (
                                            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl">
                                                <p className="text-xs font-bold mb-1">Ditolak / Alasan:</p>
                                                <p className="text-xs italic">{p.edit_reject_reason}</p>
                                                <button onClick={() => handleDismissNotification(p.id)} className="mt-2 text-[10px] font-bold bg-rose-600 text-white px-2 py-1 rounded hover:bg-rose-700 transition">Tutup Notifikasi</button>
                                            </div>
                                        ) : (
                                            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold inline-block">Menunggu Persetujuan Admin</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {p.is_approved && p.is_edit_approved ? (
                                                <button onClick={() => handleOpenEditModal(p)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer">
                                                    <span className="material-symbols-outlined text-[14px]">edit</span> Edit Sekarang
                                                </button>
                                            ) : null}

                                            {p.is_approved && !p.is_edit_requested && !p.is_edit_approved && (
                                                <button onClick={() => handleRequestEdit(p.id)} className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer" title="Minta izin edit ke Admin">
                                                    <span className="material-symbols-outlined text-[14px]">edit_note</span> Minta Edit
                                                </button>
                                            )}

                                            {p.is_edit_requested && (
                                                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">Menunggu Izin Edit</span>
                                            )}

                                            {!p.is_approved && !p.edit_reject_reason && (
                                                <button onClick={() => handleDelete(p.id)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer">
                                                    Batalkan
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pengajuans.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic font-medium">Anda belum memiliki riwayat pengajuan peminjaman.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL POPUP FORM EDIT */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-800">Edit Pengajuan Aula</h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Kegiatan</label>
                                <input type="text" required value={formData.nama_kegiatan} onChange={e => setFormData({...formData, nama_kegiatan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Aula</label>
                                    <select required value={formData.aula} onChange={e => setFormData({...formData, aula: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm">
                                        <option value="besar">Aula Besar (Maks {settings.max_peserta_besar})</option>
                                        <option value="kecil">Aula Kecil (Maks {settings.max_peserta_kecil})</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Tanggal Pelaksanaan</label>
                                    <input type="date" required value={formData.tanggal_pinjam} onChange={e => setFormData({...formData, tanggal_pinjam: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Waktu Mulai</label>
                                    <input type="time" required value={formData.waktu_mulai} onChange={e => setFormData({...formData, waktu_mulai: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Waktu Selesai</label>
                                    <input type="time" required value={formData.waktu_selesai} onChange={e => setFormData({...formData, waktu_selesai: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                                </div>
                            </div>

                            {isTimeConflict && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                    {conflictMessage}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Narasumber</label>
                                    <input type="text" list="narasumber-options-modal" required value={formData.pilihan} onChange={e => setFormData({...formData, pilihan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                                    <datalist id="narasumber-options-modal">
                                        <option value="Internal" />
                                        <option value="Eksternal" />
                                        <option value="Internal & Eksternal" />
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Jumlah Peserta</label>
                                    <input type="number" min="1" required value={formData.jumlah_peserta} onChange={e => setFormData({...formData, jumlah_peserta: e.target.value})} className={`w-full bg-slate-50 border ${isOverCapacity ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm`} />
                                    {isOverCapacity && <p className="text-rose-500 text-[11px] mt-1 font-bold">Melebihi kapasitas maksimal ({maxAllowedPeserta})!</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Asal Peserta</label>
                                    <input type="text" required value={formData.peserta} onChange={e => setFormData({...formData, peserta: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Penanggung Jawab</label>
                                    <input type="text" required value={formData.penanggung_jawab} onChange={e => setFormData({...formData, penanggung_jawab: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Sarana & Prasarana</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {opsiSarana.map(item => (
                                        <label key={item} className={`px-3 py-1.5 border rounded-xl cursor-pointer text-xs font-bold ${sarana.includes(item) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                            <input type="checkbox" className="hidden" checked={sarana.includes(item)} onChange={() => setSarana(p => p.includes(item) ? p.filter(i=>i!==item) : [...p, item])} />
                                            {item}
                                        </label>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" value={customSaranaInput} onChange={e => setCustomSaranaInput(e.target.value)} placeholder="Sarana tambahan..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none" />
                                    <button type="button" onClick={handleAddCustomSarana} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold">Tambah</button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {sarana.filter(s => !opsiSarana.includes(s)).map((s, idx) => (
                                        <div key={idx} className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                            {s} <button type="button" onClick={() => setSarana(sarana.filter(item => item !== s))} className="text-red-500 font-bold ml-1">×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer text-sm">Batal</button>
                                <button type="submit" disabled={isSaving || isTimeConflict || !!isOverCapacity} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer text-sm disabled:opacity-50 flex items-center gap-2">
                                    {isSaving ? <span className="loading loading-spinner loading-sm"></span> : null}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}