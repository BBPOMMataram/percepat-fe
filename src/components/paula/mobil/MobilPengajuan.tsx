/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import api from "@/utils/axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function MobilPengajuan() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    const [mobils, setMobils] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        tanggal_pengajuan: new Date().toISOString().split('T')[0],
        tujuan_dinas: "",
        tujuan_lokasi: "",
        tanggal_pinjam: "",
        tanggal_kembali: "",
        waktu_mulai: "",
        waktu_selesai: "",
        kendaraan: "",
        driver: "",
        jumlah_penumpang: "",
    });

    const [isTimeConflict, setIsTimeConflict] = useState(false);
    const [conflictMessage, setConflictMessage] = useState("");


    useEffect(() => {
        const fetchMobils = async () => {
            try {
                const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PAULA}/api/paula/mobils`);
                setMobils(res.data.data || res.data);
            } catch (error) {
                setMobils([
                    { nama: 'Toyota Innova Reborn (Hitam)', kapasitas: 7 },
                    { nama: 'Toyota Avanza Veloz (Putih)', kapasitas: 6 },
                    { nama: 'Mitsubishi Xpander (Silver)', kapasitas: 6 },
                    { nama: 'Toyota Hiace Commuter (Putih)', kapasitas: 15 }
                ]);
            }
        };
        fetchMobils();
    }, []);

    const checkTimeAvailability = async (pinjam: string, kembali: string, kendaraan: string) => {
        if (!pinjam || !kendaraan) return;
        
        const tglKembali = kembali || pinjam;

        if (tglKembali < pinjam) {
            toast.error("Tanggal kembali tidak boleh mendahului tanggal pinjam!");
            setIsTimeConflict(true);
            setConflictMessage("Tanggal kembali tidak valid.");
            return;
        }

        try {
            const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PAULA}/api/paula/mobil/check-time`, {
                params: { tanggal_pinjam: pinjam, tanggal_kembali: tglKembali, kendaraan }
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
        if (formData.tanggal_pinjam && formData.kendaraan) {
            checkTimeAvailability(formData.tanggal_pinjam, formData.tanggal_kembali, formData.kendaraan);
        } else {
            setIsTimeConflict(false);
            setConflictMessage("");
        }
    }, [formData.tanggal_pinjam, formData.tanggal_kembali, formData.kendaraan]);

    const selectedMobil = mobils.find(m => m.nama === formData.kendaraan);
    const maxAllowedPenumpang = selectedMobil ? selectedMobil.kapasitas : 99;
    const isOverCapacity = formData.kendaraan && parseInt(formData.jumlah_penumpang) > maxAllowedPenumpang;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isTimeConflict) return toast.error("Jadwal kendaraan bertabrakan dengan pemesanan lain!");
        if (isOverCapacity) return toast.error(`Kapasitas maksimal ${formData.kendaraan} adalah ${maxAllowedPenumpang} orang!`);
        
        setIsLoading(true);
        try {
            // Karena daftar_penumpang dihapus dari UI tapi required di backend, kirim string default
            const payload = { ...formData, daftar_penumpang: '-' };
            await api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_PAULA}/api/paula/mobil/pengajuan`, payload);
            toast.success("Pengajuan kendaraan berhasil dikirim!");
            router.push('/paula/mobil/riwayat'); 
        } catch (error) {
            toast.error("Gagal mengirim pengajuan kendaraan.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800">Form Peminjaman Mobil</h1>
                <p className="text-slate-500 mt-2">Isi detail kegiatan dinas untuk peminjaman kendaraan.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tujuan Dinas / Nama Kegiatan</label>
                        <input type="text" required value={formData.tujuan_dinas} onChange={e => setFormData({...formData, tujuan_dinas: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Cth: Pengawasan Rutin" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tujuan Lokasi</label>
                        <input type="text" required value={formData.tujuan_lokasi} onChange={e => setFormData({...formData, tujuan_lokasi: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Cth: Lombok Timur" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Kendaraan</label>
                        <select required value={formData.kendaraan} onChange={e => setFormData({...formData, kendaraan: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">-- Pilih Kendaraan --</option>
                            {mobils.map((mobil, idx) => (
                                <option key={idx} value={mobil.nama}>{mobil.nama} (Maks {mobil.kapasitas} org)</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Driver (Opsional)</label>
                        <input type="text" value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nama Driver jika ada..." />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Berangkat</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]} required value={formData.tanggal_pinjam} onChange={e => setFormData({...formData, tanggal_pinjam: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Kembali (Kosongkan jika belum pasti)</label>
                        <input type="date" min={formData.tanggal_pinjam || new Date().toISOString().split('T')[0]} value={formData.tanggal_kembali} onChange={e => setFormData({...formData, tanggal_kembali: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Berangkat</label>
                        <input type="time" required value={formData.waktu_mulai} onChange={e => setFormData({...formData, waktu_mulai: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Kembali (Opsional)</label>
                        <input type="time" value={formData.waktu_selesai} onChange={e => setFormData({...formData, waktu_selesai: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>

                {isTimeConflict && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">error</span>
                        {conflictMessage}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Penumpang</label>
                    <input type="number" min="1" required value={formData.jumlah_penumpang} onChange={e => setFormData({...formData, jumlah_penumpang: e.target.value})} className={`w-1/2 bg-white border ${isOverCapacity ? 'border-red-500' : 'border-slate-200'} rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500`} />
                    {isOverCapacity && <p className="text-red-500 text-xs mt-2 font-bold">Melebihi kapasitas mobil ({maxAllowedPenumpang} org)!</p>}
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <button type="submit" disabled={isLoading || isTimeConflict || !!isOverCapacity} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50 transition-colors cursor-pointer">
                        {isLoading ? 'Memproses...' : 'Kirim Pengajuan Mobil'}
                    </button>
                </div>
            </form>
        </div>
    );
}