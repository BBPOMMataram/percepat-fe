'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Clock, X, CheckCircle2 } from 'lucide-react';

export interface CombinedCalendarEvent {
    id?: number | string;
    type: 'aula' | 'mobil';
    tanggal_pinjam: string;
    nama_kegiatan?: string;
    tujuan_dinas?: string;
    waktu_mulai: string;
    waktu_selesai?: string;
    aula?: 'besar' | 'kecil' | string;
    kendaraan?: string;
    driver?: string;
    lokasi?: string;
    fungsi_pengusul?: string;
    penanggung_jawab?: string;
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function PaulaHeroCalendar() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CombinedCalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedModalDate, setSelectedModalDate] = useState<string | null>(null);

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA || 'http://localhost:8004';

    // Ambil data jadwal kalender Aula dan Kendaraan dari backend PAULA secara bersamaan
    useEffect(() => {
        let isMounted = true;
        const fetchAllCalendarData = async () => {
            setIsLoading(true);
            try {
                const [aulaRes, mobilRes] = await Promise.allSettled([
                    axios.get(`${baseURL}/api/paula/kalender`, { timeout: 5000 }),
                    axios.get(`${baseURL}/api/paula/mobil/kalender`, { timeout: 5000 })
                ]);

                const combined: CombinedCalendarEvent[] = [];

                if (aulaRes.status === 'fulfilled' && Array.isArray(aulaRes.value.data)) {
                    aulaRes.value.data.forEach((item: any) => {
                        combined.push({
                            ...item,
                            type: 'aula'
                        });
                    });
                }

                if (mobilRes.status === 'fulfilled' && Array.isArray(mobilRes.value.data)) {
                    mobilRes.value.data.forEach((item: any) => {
                        combined.push({
                            ...item,
                            type: 'mobil'
                        });
                    });
                }

                if (isMounted) {
                    setEvents(combined);
                }
            } catch (err) {
                console.error("Gagal mengambil data kalender gabungan", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchAllCalendarData();
        return () => { isMounted = false; };
    }, [baseURL]);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleToday = () => {
        const now = new Date();
        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    };

    // Filter agenda kegiatan untuk tanggal yang dipilih di modal
    const modalDateEvents = useMemo(() => {
        if (!selectedModalDate) return [];
        return events.filter(e => e.tanggal_pinjam === selectedModalDate);
    }, [events, selectedModalDate]);

    // Matriks tanggal kalender
    const calendarGrid = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const cells: Array<{
            day: number | null;
            dateStr: string | null;
            events: CombinedCalendarEvent[];
            hasAula: boolean;
            hasMobil: boolean;
            isToday: boolean;
        }> = [];

        // Sel kosong sebelum tanggal 1
        for (let i = 0; i < firstDay; i++) {
            cells.push({
                day: null,
                dateStr: null,
                events: [],
                hasAula: false,
                hasMobil: false,
                isToday: false
            });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Hari pada bulan aktif
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvts = events.filter(e => e.tanggal_pinjam === dateStr);
            const hasAula = dayEvts.some(e => e.type === 'aula');
            const hasMobil = dayEvts.some(e => e.type === 'mobil');

            cells.push({
                day,
                dateStr,
                events: dayEvts,
                hasAula,
                hasMobil,
                isToday: dateStr === todayStr
            });
        }

        return cells;
    }, [currentYear, currentMonth, events]);

    const formatFullDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="w-full max-w-[380px] sm:max-w-[410px] mx-auto select-none">
            {/* Kartu Kalender Modern & Sederhana beraksen BPOM */}
            <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 p-4 sm:p-5 transition-all">
                {/* Header Bar dengan Logo BPOM dan Penanda Hari Ini */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div>
                            <h3 className="font-extrabold text-[#004281] text-sm tracking-tight leading-tight">
                                Agenda Kegiatan
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Aula &amp; Kendaraan Dinas
                            </p>
                        </div>
                    </div>

                    {/* Navigasi Bulan & Penanda Hari Ini di Atas */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 text-slate-500 hover:text-[#004281] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Bulan Sebelumnya"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-bold text-slate-800 min-w-[76px] text-center">
                            {MONTH_NAMES[currentMonth].slice(0, 3)} {currentYear}
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 text-slate-500 hover:text-[#004281] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Bulan Berikutnya"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={handleToday}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#004281]/10 text-[#004281] hover:bg-[#004281] hover:text-white border border-[#004281]/25 transition-all shadow-xs cursor-pointer active:scale-95 ml-0.5"
                            title="Kembali ke Hari Ini"
                        >
                            <span>Hari Ini</span>
                        </button>
                    </div>
                </div>

                {/* Baris Nama Hari */}
                <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                    {DAY_NAMES.map((name, idx) => (
                        <div
                            key={name}
                            className={`text-[10px] font-bold py-1 uppercase tracking-wider ${
                                idx === 0 ? 'text-rose-500' : 'text-slate-400'
                            }`}
                        >
                            {name}
                        </div>
                    ))}
                </div>

                {/* Grid Tanggal */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarGrid.map((cell, idx) => {
                        if (!cell.day || !cell.dateStr) {
                            return (
                                <div
                                    key={`empty-${idx}`}
                                    className="h-9 sm:h-10 rounded-xl bg-slate-50/40"
                                />
                            );
                        }

                        const hasEvents = cell.events.length > 0;
                        const isSunday = idx % 7 === 0;

                        return (
                            <button
                                key={cell.dateStr}
                                type="button"
                                onClick={() => cell.dateStr && setSelectedModalDate(cell.dateStr)}
                                className={`h-9 sm:h-10 rounded-xl p-1 flex flex-col justify-between items-center transition-all cursor-pointer relative group ${
                                    cell.isToday
                                        ? 'bg-[#004281]/10 border border-[#004281]/40 font-black'
                                        : hasEvents
                                        ? 'bg-slate-50 hover:bg-[#004281]/5 text-slate-800 border border-slate-200/80 hover:border-[#004281]/30'
                                        : 'hover:bg-slate-100 text-slate-700'
                                }`}
                                title={
                                    hasEvents
                                        ? `${cell.events.length} kegiatan pada ${cell.day} ${MONTH_NAMES[currentMonth]}`
                                        : `${cell.day} ${MONTH_NAMES[currentMonth]}`
                                }
                            >
                                {/* Penanda Tanggal Hari Ini & Nomor Hari */}
                                {cell.isToday ? (
                                    <span className="w-6 h-6 rounded-lg bg-[#004281] text-white flex items-center justify-center text-xs font-black shadow-xs mt-0.5">
                                        {cell.day}
                                    </span>
                                ) : (
                                    <span
                                        className={`text-xs font-bold leading-none mt-1 ${
                                            isSunday ? 'text-rose-500' : 'text-slate-700'
                                        }`}
                                    >
                                        {cell.day}
                                    </span>
                                )}

                                {/* Indikator Titik Agenda Kegiatan (BPOM Blue = Aula, BPOM Green = Mobil Dinas) */}
                                {hasEvents ? (
                                    <div className="flex items-center gap-0.5 mb-0.5">
                                        {cell.hasAula && (
                                            <span
                                                className="w-1.5 h-1.5 rounded-full bg-[#004281]"
                                                title="Kegiatan Aula"
                                            />
                                        )}
                                        {cell.hasMobil && (
                                            <span
                                                className="w-1.5 h-1.5 rounded-full bg-[#04a451]"
                                                title="Peminjaman Mobil Dinas"
                                            />
                                        )}
                                        {cell.events.length > 2 && (
                                            <span className="text-[8px] font-black text-slate-500 leading-none">
                                                +{cell.events.length - 2}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="w-1.5 h-1.5"></span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legenda Bersih & Modern (Tanpa Tombol/Link ke Manapun) */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-6 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1.5 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#004281] inline-block shadow-xs"></span>
                        Aula
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#04a451] inline-block shadow-xs"></span>
                        Kendaraan Dinas
                    </span>
                </div>
            </div>

            {/* Modal Detail Kegiatan pada Tanggal yang Diklik (Hanya Menampilkan Agenda & Tombol Tutup) */}
            {selectedModalDate && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setSelectedModalDate(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Agenda Kegiatan
                                </span>
                                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                                    {formatFullDate(selectedModalDate)}
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedModalDate(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                                title="Tutup"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                            {isLoading ? (
                                <div className="py-6 text-center text-slate-400 text-xs">
                                    <span className="loading loading-spinner loading-xs text-[#004281] mr-1.5"></span>
                                    Memuat agenda kegiatan...
                                </div>
                            ) : modalDateEvents.length > 0 ? (
                                modalDateEvents.map((evt, idx) => {
                                    const isAula = evt.type === 'aula';
                                    const title = isAula ? evt.nama_kegiatan : evt.tujuan_dinas;
                                    return (
                                        <div
                                            key={idx}
                                            className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span
                                                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                        isAula
                                                            ? 'bg-[#004281]/10 text-[#004281] border border-[#004281]/25'
                                                            : 'bg-[#04a451]/10 text-[#04a451] border border-[#04a451]/25'
                                                    }`}
                                                >
                                                    {isAula ? `Aula ${evt.aula}` : evt.kendaraan || 'Kendaraan Dinas'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                    <Clock size={11} className="text-[#004281]" />
                                                    {evt.waktu_mulai?.slice(0, 5)} {evt.waktu_selesai ? `- ${evt.waktu_selesai?.slice(0, 5)}` : ''} WITA
                                                </span>
                                            </div>

                                            <h5 className="font-bold text-xs text-slate-900 leading-snug">
                                                {title}
                                            </h5>

                                            {evt.driver && (
                                                <p className="text-[11px] text-slate-500">
                                                    Driver: <strong className="text-slate-700">{evt.driver}</strong>
                                                </p>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                                    <CheckCircle2 size={24} className="mx-auto text-[#04a451] mb-1" />
                                    <p className="font-semibold text-slate-700">Tidak ada agenda terjadwal</p>
                                    <p className="text-[11px] text-slate-400">Aula dan kendaraan dinas operasional tersedia pada tanggal ini.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer (Hanya Tombol Tutup) */}
                        <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                            <span className="text-[11px] text-slate-400">
                                Total: <strong className="text-slate-700">{modalDateEvents.length}</strong> agenda
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedModalDate(null)}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
