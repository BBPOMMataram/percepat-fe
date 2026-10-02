"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function AulaKalender() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State Kalender
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_PAULA || 'http://localhost:8000';

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`${baseURL}/api/paula/kalender`);
                setEvents(res.data);
            } catch (error) {
                console.error("Gagal mengambil data kalender", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [baseURL]);

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

        // Sel kosong sebelum tanggal 1
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="p-4 border border-slate-100 bg-slate-50/50 min-h-[100px] md:min-h-[120px]"></div>);
        }

        // Sel tanggal
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Cari event pada tanggal ini
            const dayEvents = events.filter(e => e.tanggal_pinjam === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            cells.push(
                <div key={day} className={`p-2 border border-slate-100 min-h-[100px] md:min-h-[120px] flex flex-col gap-1 transition-colors ${isToday ? 'bg-blue-50/30' : 'bg-white hover:bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700'}`}>
                            {day}
                        </span>
                    </div>
                    
                    {/* Render indikator event */}
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] md:max-h-[100px] no-scrollbar">
                        {dayEvents.map((evt, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedEvent(evt)}
                                className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded w-full text-left truncate transition-transform hover:scale-[1.02] shadow-sm ${
                                    evt.aula === 'besar' 
                                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                    : 'bg-pink-100 text-pink-700 border border-pink-200'
                                }`}
                                title={`${evt.nama_kegiatan} (${evt.waktu_mulai.slice(0,5)} - ${evt.waktu_selesai.slice(0,5)})`}
                            >
                                {evt.waktu_mulai.slice(0,5)} {evt.nama_kegiatan}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        return cells;
    };

    return (
        <div className="max-w-screen-xl mx-auto animate-in fade-in duration-500 pb-10">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Kalender Aula</h1>
                <p className="text-slate-500 mt-1 font-medium">Jadwal peminjaman aula BBPOM Mataram yang telah disetujui.</p>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden p-4 md:p-8">
                
                {/* Header Navigasi Kalender */}
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

                {/* Grid Nama Hari */}
                <div className="grid grid-cols-7 gap-0 border-b border-slate-200 pb-2 mb-2 text-center">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((hari, idx) => (
                        <div key={idx} className={`text-[10px] md:text-sm font-bold uppercase tracking-wider ${idx === 0 || idx === 6 ? 'text-red-500' : 'text-slate-500'}`}>
                            {hari}
                        </div>
                    ))}
                </div>

                {/* Grid Kalender */}
                {isLoading ? (
                    <div className="py-20 text-center">
                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                        <p className="text-slate-400 mt-3 font-medium">Memuat jadwal kalender...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-0 border-l border-t border-slate-100 rounded-lg overflow-hidden shadow-inner bg-slate-50">
                        {renderCalendarCells()}
                    </div>
                )}

                <div className="mt-6 flex gap-4 text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Aula Besar
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-pink-500"></span> Aula Kecil
                    </div>
                </div>

            </div>

            {/* MODAL DETAIL EVENT */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-2xl p-0 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className={`p-5 ${selectedEvent.aula === 'besar' ? 'bg-indigo-600' : 'bg-pink-600'} text-white relative`}>
                            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors">
                                <span className="material-symbols-outlined text-[20px] block">close</span>
                            </button>
                            <div className="bg-white/20 inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2">
                                Aula {selectedEvent.aula}
                            </div>
                            <h3 className="text-xl font-black leading-tight pr-8">{selectedEvent.nama_kegiatan}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Pelaksanaan</p>
                                    <p className="font-bold text-slate-800">{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(selectedEvent.tanggal_pinjam))}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waktu Kegiatan</p>
                                    <p className="font-bold text-slate-800">{selectedEvent.waktu_mulai.slice(0,5)} WITA - {selectedEvent.waktu_selesai.slice(0,5)} WITA</p>
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