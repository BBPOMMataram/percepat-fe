/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import api from "@/utils/axios";

export default function MobilKalender() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);


    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PAULA}/api/paula/mobil/kalender`);
                setEvents(res.data);
            } catch (error) {
                console.error("Gagal mengambil data kalender mobil", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

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

    const renderCalendarCells = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="p-4 border border-slate-100 bg-slate-50/50 min-h-[100px] md:min-h-[120px]"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Filter: Cek apakah tanggal saat ini berada di dalam rentang pinjam s/d kembali
            const dayEvents = events.filter(e => {
                const start = e.tanggal_pinjam;
                const end = e.tanggal_kembali || e.tanggal_pinjam; // Jika belum kembali, anggap pinjam 1 hari untuk tampilan (atau ubah sesuai kebutuhan)
                return dateStr >= start && dateStr <= end;
            });

            const isToday = dateStr === new Date().toISOString().split('T')[0];

            cells.push(
                <div key={day} className={`p-2 border border-slate-100 min-h-[100px] md:min-h-[120px] flex flex-col gap-1 transition-colors ${isToday ? 'bg-indigo-50/30' : 'bg-white hover:bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700'}`}>
                            {day}
                        </span>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] md:max-h-[100px] no-scrollbar">
                        {dayEvents.map((evt, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedEvent(evt)}
                                className="text-[10px] md:text-xs font-bold px-2 py-1 rounded w-full text-left truncate transition-transform hover:scale-[1.02] shadow-sm bg-indigo-100 text-indigo-700 border border-indigo-200"
                                title={`${evt.kendaraan} - ${evt.tujuan_dinas} (${evt.waktu_mulai.slice(0,5)})`}
                            >
                                {evt.waktu_mulai.slice(0,5)} {evt.kendaraan}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return cells;
    };

    const formatFullDate = (dateString: string) => {
        if (!dateString) return "-";
        return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
    };

    return (
        <div className="max-w-screen-xl mx-auto animate-in fade-in duration-500 pb-10">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Kalender Mobil Dinas</h1>
                <p className="text-slate-500 mt-1 font-medium">Jadwal peminjaman kendaraan operasional BBPOM Mataram yang telah disetujui.</p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden p-4 md:p-8">
                
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrevMonth} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <h2 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight text-center">
                        {monthNames[currentMonth]} {currentYear}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-0 border-b border-slate-200 pb-2 mb-2 text-center">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((hari, idx) => (
                        <div key={idx} className={`text-[10px] md:text-sm font-bold uppercase tracking-wider ${idx === 0 || idx === 6 ? 'text-red-500' : 'text-slate-500'}`}>
                            {hari}
                        </div>
                    ))}
                </div>

                {isLoading ? (
                    <div className="py-20 text-center">
                        <span className="loading loading-spinner loading-lg text-indigo-600"></span>
                        <p className="text-slate-400 mt-3 font-medium">Memuat jadwal kalender mobil...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-0 border-l border-t border-slate-100 rounded-lg overflow-hidden shadow-inner bg-slate-50">
                        {renderCalendarCells()}
                    </div>
                )}
            </div>

            {/* MODAL DETAIL EVENT */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-2xl p-0 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-5 bg-indigo-600 text-white relative">
                            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors">
                                <span className="material-symbols-outlined text-[20px] block">close</span>
                            </button>
                            <div className="bg-white/20 inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2">
                                {selectedEvent.kendaraan}
                            </div>
                            <h3 className="text-xl font-black leading-tight pr-8">{selectedEvent.tujuan_dinas}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">location_on</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tujuan Lokasi</p>
                                    <p className="font-bold text-slate-800">{selectedEvent.tujuan_lokasi}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-slate-600">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Peminjaman</p>
                                    <p className="font-bold text-slate-800">{formatFullDate(selectedEvent.tanggal_pinjam)}</p>
                                    {selectedEvent.tanggal_kembali && selectedEvent.tanggal_kembali !== selectedEvent.tanggal_pinjam && (
                                        <p className="text-sm font-semibold text-indigo-600 mt-0.5">s/d {formatFullDate(selectedEvent.tanggal_kembali)}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waktu Keberangkatan</p>
                                    <p className="font-bold text-slate-800">{selectedEvent.waktu_mulai.slice(0,5)} WITA {selectedEvent.waktu_selesai ? `- ${selectedEvent.waktu_selesai.slice(0,5)} WITA` : ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">group</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Penumpang & Driver</p>
                                    <p className="font-bold text-slate-800">{selectedEvent.jumlah_penumpang} Orang {selectedEvent.driver ? `(Driver: ${selectedEvent.driver})` : ''}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setSelectedEvent(null)} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors text-sm">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}