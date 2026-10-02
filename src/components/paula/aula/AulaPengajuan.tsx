/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import api from "@/utils/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function AulaPengajuan() {
    const router = useRouter();
    
    // Ambil data user yang sedang login dari Redux
    const { user } = useSelector((state: RootState) => state.auth);
    
    const [isLoading, setIsLoading] = useState(false);
    
    const [settings, setSettings] = useState({ max_booking_days: 7, max_peserta_besar: 100, max_peserta_kecil: 50 });
    
    const [formData, setFormData] = useState({
        tanggal_pengajuan: new Date().toISOString().split('T')[0],
        nama_kegiatan: "",
        tanggal_pinjam: "",
        aula: "",
        waktu_mulai: "",
        waktu_selesai: "",
        pilihan: "", 
        peserta: "",
        jumlah_peserta: "",
        // penanggung_jawab dihapus dari state karena akan disisipkan saat submit
    });

    const [isTimeConflict, setIsTimeConflict] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");

    const [sarana, setSarana] = useState<string[]>([]);
    const [customSaranaInput, setCustomSaranaInput] = useState("");
    const opsiSarana = ["Proyektor", "Kamera", "Zoom Meeting", "Sound System"];

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA || 'http://localhost:8000';

    useEffect(() => {
        api.get(`${baseURL}/api/paula/settings`).then(res => setSettings(res.data)).catch(console.error);
    }, [baseURL]);

    const handleAddCustomSarana = () => {
        if (customSaranaInput.trim() && !sarana.includes(customSaranaInput.trim())) {
            setSarana([...sarana, customSaranaInput.trim()]);
            setCustomSaranaInput("");
        }
    };

    const checkTimeAvailability = async (mulai: string, selesai: string, tanggal: string, aula: string) => {
        if (!mulai || !selesai || !tanggal || !aula) return;
        
        if (selesai <= mulai) {
            toast.error("Waktu selesai harus setelah waktu mulai!");
            setIsTimeConflict(true);
            setConflictMessage("Waktu selesai harus setelah waktu mulai.");
            return;
        }

        try {
            const res = await api.get(`${baseURL}/api/paula/check-time`, {
                params: { tanggal, waktu_mulai: mulai, waktu_selesai: selesai, aula }
            });
            if (!res.data.valid) {
                setIsTimeConflict(true);
                setConflictMessage(res.data.message);
                toast.error(res.data.message);
            } else {
                setIsTimeConflict(false);
                setConflictMessage("");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (formData.waktu_selesai && formData.waktu_mulai && formData.tanggal_pinjam && formData.aula) {
            checkTimeAvailability(formData.waktu_mulai, formData.waktu_selesai, formData.tanggal_pinjam, formData.aula);
        } else {
            setIsTimeConflict(false);
            setConflictMessage("");
        }
    }, [formData.waktu_selesai, formData.waktu_mulai, formData.tanggal_pinjam, formData.aula]);

    const maxAllowedPeserta = formData.aula === 'besar' ? settings.max_peserta_besar : settings.max_peserta_kecil;
    const isOverCapacity = formData.aula && parseInt(formData.jumlah_peserta) > maxAllowedPeserta;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isTimeConflict) return toast.error("Waktu dan tempat bertabrakan dengan pemesanan lain!");
        if (isOverCapacity) return toast.error(`Kapasitas maksimal aula ${formData.aula} adalah ${maxAllowedPeserta} orang!`);
        
        setIsLoading(true);
        try {
            // Sisipkan penanggung_jawab secara otomatis menggunakan nama user yang login
            const payload = { 
                ...formData, 
                penanggung_jawab: user?.name || "User", 
                sarana_prasarana: sarana 
            };
            
            await api.post(`${baseURL}/api/paula/pengajuan`, payload);
            toast.success("Pengajuan berhasil dikirim!");
            router.push('/paula/aula'); 
        } catch (error) {
            toast.error("Gagal mengirim pengajuan.");
        } finally {
            setIsLoading(false);
        }
    };

    const maxDateObj = new Date();
    maxDateObj.setDate(maxDateObj.getDate() + settings.max_booking_days);
    const maxDate = maxDateObj.toISOString().split('T')[0];

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800">Form Pengajuan Aula</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nama Kegiatan</label>
                        <input type="text" required value={formData.nama_kegiatan} onChange={e => setFormData({...formData, nama_kegiatan: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Aula</label>
                        <select required value={formData.aula} onChange={e => setFormData({...formData, aula: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">-- Pilih Aula --</option>
                            <option value="besar">Aula Besar (Maks {settings.max_peserta_besar})</option>
                            <option value="kecil">Aula Kecil (Maks {settings.max_peserta_kecil})</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Pelaksanaan (Maks H+{settings.max_booking_days})</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]} max={maxDate} required value={formData.tanggal_pinjam} onChange={e => setFormData({...formData, tanggal_pinjam: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {formData.tanggal_pinjam && (
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Mulai</label>
                                <input type="time" required value={formData.waktu_mulai} onChange={e => setFormData({...formData, waktu_mulai: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Selesai</label>
                                <input type="time" required value={formData.waktu_selesai} onChange={e => setFormData({...formData, waktu_selesai: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3" />
                            </div>
                        </div>
                    )}
                </div>

                {isTimeConflict && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">error</span>
                        {conflictMessage}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Narasumber</label>
                        <input 
                            type="text" 
                            list="narasumber-options"
                            required 
                            value={formData.pilihan} 
                            onChange={e => setFormData({...formData, pilihan: e.target.value})} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Pilih atau ketik narasumber..." 
                        />
                        <datalist id="narasumber-options">
                            <option value="Internal" />
                            <option value="Eksternal" />
                            <option value="Internal & Eksternal" />
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Asal Peserta</label>
                        <input type="text" required value={formData.peserta} onChange={e => setFormData({...formData, peserta: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Instansi/Asal Peserta..." />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Peserta</label>
                    <input type="number" min="1" required value={formData.jumlah_peserta} onChange={e => setFormData({...formData, jumlah_peserta: e.target.value})} className={`w-1/2 bg-white border ${isOverCapacity ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3`} />
                    {isOverCapacity && <p className="text-red-500 text-xs mt-2 font-bold">Melebihi kapasitas maksimal ({maxAllowedPeserta})!</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Sarana & Prasarana</label>
                    <div className="flex flex-wrap gap-3 mb-3">
                        {opsiSarana.map(item => (
                            <label key={item} className={`px-4 py-2 border rounded-full cursor-pointer ${sarana.includes(item) ? 'bg-blue-100 border-blue-400 text-blue-700 font-bold' : 'bg-white'}`}>
                                <input type="checkbox" className="hidden" checked={sarana.includes(item)} onChange={() => setSarana(p => p.includes(item) ? p.filter(i=>i!==item) : [...p, item])} />
                                {item}
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-3 w-1/2">
                        <input type="text" value={customSaranaInput} onChange={e => setCustomSaranaInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddCustomSarana(); }}} placeholder="Sarana tambahan..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" />
                        <button type="button" onClick={handleAddCustomSarana} className="bg-slate-800 text-white px-4 py-2 rounded-xl">Tambah</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {sarana.filter(s => !opsiSarana.includes(s)).map((s, idx) => (
                            <div key={idx} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{s} <button type="button" onClick={() => setSarana(sarana.filter(item => item !== s))} className="ml-2 text-red-500">x</button></div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <button type="submit" disabled={isLoading || isTimeConflict || !!isOverCapacity} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50">Kirim Pengajuan</button>
                </div>
            </form>
        </div>
    );
}