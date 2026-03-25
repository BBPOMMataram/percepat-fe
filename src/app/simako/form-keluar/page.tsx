"use client";

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';

interface FormData {
    nama_pegawai: string;
    nama_katim: string;
    alasan_keluar: string;
    waktu_keluar: string;
    waktu_kembali: string;
}

const employees = [
    "Ahmad Santoso",
    "Siti Nurhaliza",
    "Budi Hartono",
    "Dewi Sartika",
    "Muhammad Rizki",
    "Rina Wijaya",
    "Eko Prasetyo",
    "Larasati Putri",
    "Fajar Nugroho",
    "Citra Dewi"
];

export default function FormKeluarPage() {
    const [formData, setFormData] = useState<FormData>({
        nama_pegawai: '',
        nama_katim: '',
        alasan_keluar: '',
        waktu_keluar: '',
        waktu_kembali: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [katimSearchTerm, setKatimSearchTerm] = useState('');
    const [katimIsDropdownOpen, setKatimIsDropdownOpen] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const filteredKatimEmployees = employees.filter(emp =>
        emp.toLowerCase().includes(katimSearchTerm.toLowerCase())
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Hapus error saat user mulai mengetik kembali
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.nama_pegawai.trim()) newErrors.nama_pegawai = 'Nama pegawai wajib diisi';
        // if (!formData.nama_katim.trim()) newErrors.nama_katim = 'Nama katim wajib diisi';
        // if (!formData.alasan_keluar.trim()) newErrors.alasan_keluar = 'Alasan keluar wajib diisi';
        // if (!formData.waktu_keluar) newErrors.waktu_keluar = 'Waktu keluar wajib dipilih';
        // if (!formData.waktu_kembali) newErrors.waktu_kembali = 'Waktu kembali wajib dipilih';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            // Simulasi API Call
            console.log('Form submitted:', formData);
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSuccess(true);
            setFormData({
                nama_pegawai: '',
                nama_katim: '',
                alasan_keluar: '',
                waktu_keluar: '',
                waktu_kembali: '',
            });

            // Menghilangkan pesan sukses setelah 5 detik
            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-rose-500 via-pink-500 to-orange-400 relative overflow-hidden font-sans">
            {/* Background Floating Elements */}
            <div className="absolute inset-0 pointer-events-none">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-white/30 rounded-full"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: `${10 + i * 20}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            scale: [1, 1.4, 1],
                            opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                            duration: 4 + i,
                            repeat: Infinity,
                            repeatType: "reverse",
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
                <Image
                    src="/assets/images/bpom.webp"
                    alt="BPOM Logo"
                    width={100}
                    height={100}
                    className="mb-8 opacity-90 drop-shadow-lg"
                />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-2xl"
                >
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 lg:p-12">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl lg:text-5xl font-black text-center text-white mb-4 drop-shadow-md"
                        >
                            Form Izin Keluar
                        </motion.h1>
                        <p className="text-lg text-white/90 text-center mb-10 leading-relaxed">
                            Isi form di bawah ini untuk mengajukan izin keluar kantor
                        </p>

                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 text-white">
                            {/* Input Nama Pegawai */}
                            <div className="relative">
                                <label className="block font-medium mb-2 text-lg">Nama Pegawai *</label>
                                <input
                                    type="text"
                                    placeholder="Cari nama pegawai..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    className="w-full px-4 py-3 pr-10 rounded-2xl text-slate-800 border border-white/30 bg-white/90 focus:bg-white focus:ring-4 focus:ring-rose-500/30 transition-all duration-300 outline-none"
                                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                />
                                {isDropdownOpen && filteredEmployees.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-h-60 overflow-auto mt-1">
                                        {filteredEmployees.map((emp) => (
                                            <li
                                                key={emp}
                                                className="px-4 py-3 hover:bg-rose-100 cursor-pointer text-slate-800 text-sm font-medium border-b border-white/20 last:border-b-0 transition-colors duration-200"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setFormData((prev) => ({ ...prev, nama_pegawai: emp }));
                                                    setSearchTerm(emp);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {emp}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {isDropdownOpen && filteredEmployees.length === 0 && (
                                    <div className="absolute z-20 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl mt-1 p-4 text-center text-slate-600 text-sm">
                                        Pegawai tidak ditemukan
                                    </div>
                                )}
                                {errors.nama_pegawai && <p className="text-rose-100 text-sm mt-1 ml-2 font-medium">{errors.nama_pegawai}</p>}
                            </div>

                            {/* Input Nama Katim */}
                            <div className="relative">
                                <label className="block font-medium mb-2 text-lg">Nama Ketua Tim (Katim)</label>
                                <input
                                    type="text"
                                    placeholder="Cari nama ketua tim..."
                                    value={katimSearchTerm}
                                    onChange={(e) => {
                                        setKatimSearchTerm(e.target.value);
                                        setKatimIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setKatimIsDropdownOpen(true)}
                                    className="w-full px-4 py-3 pr-10 rounded-2xl text-slate-800 border border-white/30 bg-white/90 focus:bg-white focus:ring-4 focus:ring-rose-500/30 transition-all duration-300 outline-none"
                                    onBlur={() => setTimeout(() => setKatimIsDropdownOpen(false), 200)}
                                />
                                {katimIsDropdownOpen && filteredKatimEmployees.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-h-60 overflow-auto mt-1">
                                        {filteredKatimEmployees.map((emp) => (
                                            <li
                                                key={emp}
                                                className="px-4 py-3 hover:bg-rose-100 cursor-pointer text-slate-800 text-sm font-medium border-b border-white/20 last:border-b-0 transition-colors duration-200"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setFormData((prev) => ({ ...prev, nama_katim: emp }));
                                                    setKatimSearchTerm(emp);
                                                    setKatimIsDropdownOpen(false);
                                                }}
                                            >
                                                {emp}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {katimIsDropdownOpen && filteredKatimEmployees.length === 0 && (
                                    <div className="absolute z-20 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl mt-1 p-4 text-center text-slate-600 text-sm">
                                        Ketua tim tidak ditemukan
                                    </div>
                                )}
                                {errors.nama_katim && <p className="text-rose-100 text-sm mt-1 ml-2 font-medium">{errors.nama_katim}</p>}
                            </div>

                            {/* Input Alasan */}
                            <div>
                                <label className="block font-medium mb-2 text-lg">Keterangan / Alasan Keluar</label>
                                <textarea
                                    name="alasan_keluar"
                                    rows={3}
                                    value={formData.alasan_keluar}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl text-slate-800 border border-white/30 bg-white/90 focus:bg-white focus:ring-4 focus:ring-rose-500/30 transition-all duration-300 outline-none resize-none"
                                    placeholder="Jelaskan alasan secara singkat..."
                                />
                                {errors.alasan_keluar && <p className="text-rose-100 text-sm mt-1 ml-2 font-medium">{errors.alasan_keluar}</p>}
                            </div>

                            {/* Grid Waktu */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 font-medium mb-2 text-lg">
                                        <span className="material-symbols-outlined">schedule</span> Waktu Keluar
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="waktu_keluar"
                                        value={formData.waktu_keluar}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl text-slate-800 border border-white/30 bg-white/90 focus:bg-white focus:ring-4 focus:ring-rose-500/30 transition-all duration-300 outline-none"
                                    />
                                    {errors.waktu_keluar && <p className="text-rose-100 text-sm mt-1 ml-2 font-medium">{errors.waktu_keluar}</p>}
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 font-medium mb-2 text-lg">
                                        <span className="material-symbols-outlined">schedule_send</span> Waktu Kembali
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="waktu_kembali"
                                        value={formData.waktu_kembali}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl text-slate-800 border border-white/30 bg-white/90 focus:bg-white focus:ring-4 focus:ring-rose-500/30 transition-all duration-300 outline-none"
                                    />
                                    {errors.waktu_kembali && <p className="text-rose-100 text-sm mt-1 ml-2 font-medium">{errors.waktu_kembali}</p>}
                                </div>
                            </div>

                            {/* Submit Button */}{/* Container: defaultnya col-reverse agar Kembali (elemen pertama) pindah ke bawah */}
                            <div className="flex flex-col-reverse gap-4 justify-center items-center lg:flex-row lg:gap-2">

                                {/* Tombol Kembali (Sekarang secara visual di bawah pada mobile) */}
                                <Link href="/simako" className="w-full lg:w-auto">
                                    <motion.button
                                        whileHover={{ scale: 1.05, x: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-full flex items-center justify-center gap-2 text-white/80 hover:text-white transition-all duration-300 text-lg font-medium bg-white/10 px-6 py-2 rounded-full border border-white/20"
                                    >
                                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                                        Kembali
                                    </motion.button>
                                </Link>

                                {/* Tombol Submit */}
                                <motion.button
                                    type="submit"
                                    disabled={submitting}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full lg:flex-1 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg py-2 px-6 rounded-full shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-2xl">send</span>
                                            Ajukan Izin Keluar
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>

                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="mt-8 p-6 bg-emerald-500/30 border border-emerald-400/50 rounded-2xl backdrop-blur-md text-center"
                                >
                                    <span className="material-symbols-outlined text-4xl text-emerald-200 mb-2 block">check_circle</span>
                                    <p className="text-xl font-bold text-white">Pengajuan Berhasil!</p>
                                    <p className="text-white/80">Data Anda telah tercatat ke dalam sistem.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}