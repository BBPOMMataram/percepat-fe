"use client";

import { showAlert } from '@/features/alertSlice';
import { AppDispatch } from '@/redux/store';
import api from '@/utils/api';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

interface FormData {
    id_pegawai: number | null;
    id_katim: number | null;
    keperluan: string;
    waktu_keluar: string;
    waktu_kembali: string;
}

export default function SimakoFormKeluarSecurity() {
    const [formData, setFormData] = useState<FormData>({
        id_pegawai: null,
        id_katim: null,
        keperluan: '',
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
    const [employees, setEmployees] = useState<{ id: number, name: string }[]>([]);
    const [katimEmployees, setKatimEmployees] = useState<{ id: number, name: string }[]>([]);
    const formRef = useRef<HTMLFormElement>(null);

    const dispatch = useDispatch<AppDispatch>()

    const filteredKatimEmployees = katimEmployees.filter((katim) =>
        katim.name.toLowerCase().includes(katimSearchTerm.toLowerCase())
    );

    const handlePegawaiSelect = (emp: { id: number, name: string }) => {
        setFormData((prev) => ({ ...prev, id_pegawai: emp.id }));
        setSearchTerm(emp.name);
        setIsDropdownOpen(false);
    };

    const handleKatimSelect = (emp: { id: number, name: string }) => {
        setFormData((prev) => ({ ...prev, id_katim: emp.id }));
        setKatimSearchTerm(emp.name);
        setKatimIsDropdownOpen(false);
    };

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

    const filteredEmployees = employees.filter((emp) =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        // 1. Logika Validasi
        if (!formData.id_pegawai) newErrors.id_pegawai = 'Pegawai wajib dipilih';
        if (!formData.id_katim) newErrors.id_katim = 'Katim wajib dipilih';
        if (!formData.keperluan) newErrors.keperluan = 'Keperluan wajib diisi';
        if (!formData.waktu_keluar) newErrors.waktu_keluar = 'Waktu keluar wajib dipilih';

        setErrors(newErrors);

        // 2. Cek apakah ada error
        const hasErrors = Object.keys(newErrors).length > 0;

        if (hasErrors) {
            // Ambil pesan error pertama untuk ditampilkan di alert (opsional)
            const firstErrorMessage = Object.values(newErrors)[0];

            dispatch(
                showAlert({
                    type: 'error',
                    message: firstErrorMessage,
                    description: firstErrorMessage || 'Mohon lengkapi seluruh data yang wajib diisi.',
                })
            );
            return false;
        }

        return true;
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
            // setFormData({
            //     id_pegawai: null,
            //     id_katim: null,
            //     keperluan: '',
            //     waktu_keluar: '',
            //     waktu_kembali: '',
            // });

            // Menghilangkan pesan sukses setelah 5 detik
            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getAllUsers = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-all-users`
        ).then((res) => {
            setEmployees(res.data);
            setKatimEmployees(res.data.filter((user: any) => user.employee?.group_jabatan_id === 3));
        }).catch((err) => {
            console.log(err);
        })
    }

    useEffect(() => {
        getAllUsers();

        // set waktu keluar otomatis saat ini
        const now: Date = new Date();
        const offset: number = now.getTimezoneOffset() * 60000;

        // Mengurangi timestamp (number), bukan objek Date
        const localISOTime: string = new Date(now.getTime() - offset).toISOString();

        const formattedDateTime: string = localISOTime.slice(0, 16);

        setFormData((prev) => ({
            ...prev,
            waktu_keluar: formattedDateTime
        }));
    }, [])

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
                        <p className="text-lg text-white/90 text-center mb-10 leading-relaxed animate-pulse">
                            Form ini diisi oleh security
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
                                    onKeyDown={(e) => e.key === "Escape" && setIsDropdownOpen(false)}
                                    onClick={(e) => setIsDropdownOpen(true)}
                                />
                                {isDropdownOpen && filteredEmployees.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-h-60 overflow-auto mt-1">
                                        {filteredEmployees.map((emp) => (
                                            <li
                                                key={emp.id}
                                                className="px-4 py-3 hover:bg-rose-100 cursor-pointer text-slate-800 text-sm font-medium border-b border-white/20 last:border-b-0 transition-colors duration-200"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handlePegawaiSelect(emp);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                {emp.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {isDropdownOpen && filteredEmployees.length === 0 && (
                                    <div className="absolute z-20 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl mt-1 p-4 text-center text-slate-600 text-sm">
                                        Pegawai tidak ditemukan
                                    </div>
                                )}
                                {errors.id_pegawai && <p className="text-red-100 animate-pulse text-sm mt-1 ml-2 font-medium">{errors.id_pegawai}</p>}
                            </div>

                            {/* Input Nama Katim */}
                            <div className="relative">
                                <label className="block font-medium mb-2 text-lg">Nama Ketua Tim (Katim) *</label>
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
                                    onKeyDown={(e) => e.key === "Escape" && setKatimIsDropdownOpen(false)}
                                    onClick={(e) => setKatimIsDropdownOpen(true)}
                                />
                                {katimIsDropdownOpen && filteredKatimEmployees.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl max-h-60 overflow-auto mt-1">
                                        {filteredKatimEmployees.map((emp) => (
                                            <li
                                                key={emp.id}
                                                className="px-4 py-3 hover:bg-rose-100 cursor-pointer text-slate-800 text-sm font-medium border-b border-white/20 last:border-b-0 transition-colors duration-200"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    handleKatimSelect(emp);
                                                    setKatimIsDropdownOpen(false);
                                                }}
                                            >
                                                {emp.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {katimIsDropdownOpen && filteredKatimEmployees.length === 0 && (
                                    <div className="absolute z-20 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl mt-1 p-4 text-center text-slate-600 text-sm">
                                        Ketua tim tidak ditemukan
                                    </div>
                                )}
                                {errors.id_katim && <p className="text-red-100 animate-pulse text-sm mt-1 ml-2 font-medium">{errors.id_katim}</p>}
                            </div>

                            {/* Input Alasan */}
                            <div>
                                <label className="block font-medium mb-2 text-lg">Keperluan *</label>
                                <textarea
                                    name="keperluan"
                                    rows={3}
                                    value={formData.keperluan}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-2xl text-slate-800 border border-white/30 bg-white/90 focus:bg-white focus:ring-4 focus:ring-rose-500/30 transition-all duration-300 outline-none resize-none"
                                    placeholder="Jelaskan keperluan secara singkat..."
                                />
                                {errors.keperluan && <p className="text-red-100 animate-pulse text-sm mt-1 ml-2 font-medium">{errors.keperluan}</p>}
                            </div>

                            {/* Grid Waktu */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 font-medium mb-2 text-lg">
                                        <span className="material-symbols-outlined">schedule</span> Waktu Keluar *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="waktu_keluar"
                                        value={formData.waktu_keluar}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-2xl text-slate-800 border border-white/30 bg-white/90 focus:bg-white focus:ring-4 focus:ring-rose-500/30 transition-all duration-300 outline-none"
                                    />
                                    {errors.waktu_keluar && <p className="text-red-100 animate-pulse text-sm mt-1 ml-2 font-medium">{errors.waktu_keluar}</p>}
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
                                    {errors.waktu_kembali && <p className="text-red-100 animate-pulse text-sm mt-1 ml-2 font-medium">{errors.waktu_kembali}</p>}
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