"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/utils/api";
import { generateSismoraF63Pdf, SismoraPdfDayData } from "@/utils/sismoraPdfExport";
import { toast } from "react-toastify";

interface ExportPdfF63ModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialRoomId?: string;
    initialMonth?: string;
    roomsList: any[];
}

interface PenanggungJawabItem {
    id: number;
    laboratorium: string;
    penyelia: string;
    penanggung_jawab: string;
    keterangan?: string;
}

const INDONESIAN_MONTHS = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function ExportPdfF63Modal({
    isOpen,
    onClose,
    initialRoomId,
    initialMonth,
    roomsList,
}: ExportPdfF63ModalProps) {
    const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId || "");
    const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || "");
    
    const [pjList, setPjList] = useState<PenanggungJawabItem[]>([]);
    const [selectedLab, setSelectedLab] = useState<string>("");
    const [penyelia, setPenyelia] = useState<string>("");
    const [penanggungJawab, setPenanggungJawab] = useState<string>("");
    const [formCode, setFormCode] = useState<string>("F-6.3 (04) Rev 02");
    const [tempReq, setTempReq] = useState<string>("");
    const [humReq, setHumReq] = useState<string>("");

    const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // Sync props to state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialRoomId) setSelectedRoomId(initialRoomId);
            else if (roomsList.length > 0 && !selectedRoomId) setSelectedRoomId(String(roomsList[0].id));

            if (initialMonth) setSelectedMonth(initialMonth);
            else {
                const now = new Date();
                const m = String(now.getMonth() + 1).padStart(2, "0");
                setSelectedMonth(`${now.getFullYear()}-${m}`);
            }
        }
    }, [isOpen, initialRoomId, initialMonth, roomsList]);

    // Fetch Penanggung Jawab list from backend
    useEffect(() => {
        if (!isOpen) return;

        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/penanggung-jawabs`)
            .then(({ data }) => {
                const list = Array.isArray(data) ? data : data?.data || [];
                setPjList(list);
            })
            .catch((err) => {
                console.error("Gagal memuat data penanggung jawab:", err);
            });
    }, [isOpen]);

    // Current Room Object
    const currentRoom = useMemo(() => {
        return roomsList.find((r) => String(r.id) === String(selectedRoomId));
    }, [roomsList, selectedRoomId]);

    // Month-Year display string (e.g. "Oktober 2026")
    const monthYearDisplay = useMemo(() => {
        if (!selectedMonth || !selectedMonth.includes("-")) return "";
        const [y, m] = selectedMonth.split("-");
        const monthIdx = parseInt(m, 10) - 1;
        const monthName = INDONESIAN_MONTHS[monthIdx] || m;
        return `${monthName} ${y}`;
    }, [selectedMonth]);

    // Days in selected month
    const daysInMonth = useMemo(() => {
        if (!selectedMonth || !selectedMonth.includes("-")) return 31;
        const [y, m] = selectedMonth.split("-");
        return new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
    }, [selectedMonth]);

    // Auto-detect and populate requirements & PJ when room changes
    useEffect(() => {
        if (!currentRoom) return;

        const roomType = currentRoom.room_type;
        const roomName = currentRoom.nama || "";

        // 1. Requirements
        if (roomType) {
            const minT = roomType.temp_min != null ? parseFloat(roomType.temp_min) : null;
            const maxT = roomType.temp_max != null ? parseFloat(roomType.temp_max) : null;
            if (minT != null && maxT != null) {
                setTempReq(`${minT} - ${maxT} °C`);
            } else if (maxT != null) {
                setTempReq(`Maks. ${maxT} °C`);
            } else if (minT != null) {
                setTempReq(`Min. ${minT} °C`);
            } else {
                setTempReq("-");
            }

            const minH = roomType.hum_min != null ? parseFloat(roomType.hum_min) : null;
            const maxH = roomType.hum_max != null ? parseFloat(roomType.hum_max) : null;
            if (roomType.is_humidity && minH != null && maxH != null) {
                setHumReq(`${minH} - ${maxH}%, sesuai IKJM 6.3/BBPOM MTR/20`);
            } else if (roomType.is_humidity && maxH != null) {
                setHumReq(`Maks. ${maxH}%, sesuai IKJM 6.3/BBPOM MTR/20`);
            } else {
                setHumReq("sesuai IKJM 6.3/BBPOM MTR/20");
            }

            // Set Form Code based on room type
            const rtNameLower = (roomType.nama || "").toLowerCase();
            if (rtNameLower.includes("instrumen")) {
                setFormCode("F-6.3 (06) Rev 02");
            } else if (rtNameLower.includes("staf") || rtNameLower.includes("staff")) {
                setFormCode("F-6.3 (07)");
            } else {
                setFormCode("F-6.3 (04) Rev 02");
            }
        }

        // 2. Auto-match Lab & PJ from room name
        const nameLower = roomName.toLowerCase();
        let matchedLab = "";

        if (nameLower.includes("mikrobiologi") || nameLower.includes("mikro")) {
            matchedLab = "Mikrobiologi";
        } else if (nameLower.includes("pangan")) {
            matchedLab = "Pangan";
        } else if (nameLower.includes("otsk") || nameLower.includes("tradisional")) {
            matchedLab = "OTSK";
        } else if (nameLower.includes("kosmetik")) {
            matchedLab = "Kosmetik";
        } else if (nameLower.includes("obat") || nameLower.includes("disolusi") || nameLower.includes("aas")) {
            matchedLab = "Obat";
        }

        if (matchedLab) {
            setSelectedLab(matchedLab);
            const found = pjList.find(
                (p) => p.laboratorium.toLowerCase() === matchedLab.toLowerCase()
            );
            if (found) {
                setPenyelia(found.penyelia);
                setPenanggungJawab(found.penanggung_jawab);
            }
        }
    }, [currentRoom, pjList]);

    // Handle when user explicitly changes Laboratorium dropdown
    const handleLabChange = (labName: string) => {
        setSelectedLab(labName);
        const found = pjList.find((p) => p.laboratorium === labName);
        if (found) {
            setPenyelia(found.penyelia);
            setPenanggungJawab(found.penanggung_jawab);
        }
    };

    // Build PDF instance and preview URL
    const buildPdf = useCallback(async () => {
        if (!selectedRoomId || !selectedMonth) {
            toast.warning("Silakan pilih ruangan dan bulan pemantauan.");
            return null;
        }

        setIsGenerating(true);
        setIsLoadingData(true);
        try {
            // Fetch mutations for this room and month
            const params = new URLSearchParams();
            params.append("room_id", selectedRoomId);
            params.append("per_page", "1000");

            const res = await api.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/mutations?${params.toString()}`
            );

            const rawList = Array.isArray(res.data) ? res.data : res.data?.data || [];
            // Filter records matching month YYYY-MM
            const monthMutations = rawList.filter((m: any) =>
                m.tanggal && m.tanggal.startsWith(selectedMonth)
            );

            // Prepare Shift 1 (08.00) and Shift 2 (13.00) day arrays
            const shift1Array: SismoraPdfDayData[] = [];
            const shift2Array: SismoraPdfDayData[] = [];

            for (let d = 1; d <= 31; d++) {
                const dayStr = String(d).padStart(2, "0");
                const targetDate = `${selectedMonth}-${dayStr}`;

                // All mutations on this day
                const dayMutations = monthMutations.filter((m: any) =>
                    m.tanggal.startsWith(targetDate)
                );

                // Find Shift 1 (morning ~08:00 WITA)
                const s1 = dayMutations.find((m: any) => {
                    const j = String(m.jam || "");
                    return j.startsWith("08:") || j.startsWith("07:") || j.startsWith("09:");
                }) || (dayMutations.length > 0 && dayMutations[0]);

                if (s1 && s1.temperature != null) {
                    shift1Array.push({
                        day: d,
                        temp: parseFloat(s1.temperature),
                        hum: s1.humidity != null ? parseFloat(s1.humidity) : null,
                    });
                } else {
                    shift1Array.push({ day: d, temp: null, hum: null });
                }

                // Find Shift 2 (afternoon ~13:00 WITA)
                const s2 = dayMutations.find((m: any) => {
                    const j = String(m.jam || "");
                    return j.startsWith("13:") || j.startsWith("12:") || j.startsWith("14:");
                }) || (dayMutations.length > 1 ? dayMutations[1] : null);

                if (s2 && s2.temperature != null) {
                    shift2Array.push({
                        day: d,
                        temp: parseFloat(s2.temperature),
                        hum: s2.humidity != null ? parseFloat(s2.humidity) : null,
                    });
                } else {
                    shift2Array.push({ day: d, temp: null, hum: null });
                }
            }

            const doc = generateSismoraF63Pdf({
                roomName: currentRoom?.nama || "Ruangan",
                monthYearStr: monthYearDisplay,
                tempRequirement: tempReq,
                humRequirement: humReq,
                penyelia: penyelia.trim(),
                penanggungJawab: penanggungJawab.trim(),
                formCode: formCode.trim(),
                shift1Data: shift1Array,
                shift2Data: shift2Array,
                daysInMonth,
            });

            return doc;
        } catch (err) {
            console.error("Gagal membuat PDF:", err);
            toast.error("Gagal memproses data pemantauan untuk PDF");
            return null;
        } finally {
            setIsGenerating(false);
            setIsLoadingData(false);
        }
    }, [
        selectedRoomId,
        selectedMonth,
        currentRoom,
        monthYearDisplay,
        tempReq,
        humReq,
        penyelia,
        penanggungJawab,
        formCode,
        daysInMonth,
    ]);

    // Live update preview whenever parameters change
    const updatePreview = useCallback(async () => {
        const doc = await buildPdf();
        if (doc) {
            const blobUrl = String(doc.output("bloburl"));
            setPreviewPdfUrl(blobUrl);
        }
    }, [buildPdf]);

    useEffect(() => {
        if (isOpen && selectedRoomId && selectedMonth) {
            const timer = setTimeout(() => {
                updatePreview();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, selectedRoomId, selectedMonth, penyelia, penanggungJawab, formCode, tempReq, humReq, updatePreview]);

    // Download action
    const handleDownload = async () => {
        const doc = await buildPdf();
        if (doc) {
            const cleanRoom = (currentRoom?.nama || "Ruangan").replace(/[^a-zA-Z0-9_-]/g, "_");
            const cleanMonth = selectedMonth.replace("-", "_");
            const filename = `Form_F-6.3_${cleanRoom}_${cleanMonth}.pdf`;
            doc.save(filename);
            toast.success(`PDF ${filename} berhasil diunduh!`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open z-50">
            <div className="modal-box max-w-6xl w-11/12 rounded-3xl p-6 shadow-2xl bg-white border border-gray-100 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                Export Form Pemantauan Suhu & Kelembaban (F-6.3)
                            </h3>
                            <p className="text-xs text-gray-500">
                                Pratinjau dan sesuaikan isian formulir sebelum mengunduh berkas PDF resmi
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Body: Split View (Settings Left, PDF Preview Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 overflow-y-auto pr-1 flex-1">
                    {/* Left Panel: Form Settings & Review (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/60 space-y-3.5">
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
                                Parameter Formulir
                            </h4>

                            {/* Ruangan Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Ruangan Pemantauan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="select select-bordered select-sm w-full font-medium"
                                >
                                    <option value="" disabled>Pilih Ruangan</option>
                                    {roomsList.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.nama} {r.room_type?.nama ? `(${r.room_type.nama})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Bulan Pemantauan */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Bulan Pemantauan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="input input-bordered input-sm w-full"
                                />
                                <span className="text-[11px] text-gray-500 mt-0.5 block">
                                    Format cetak: <strong className="text-gray-800">{monthYearDisplay || "-"}</strong> ({daysInMonth} hari)
                                </span>
                            </div>

                            {/* Kode Formulir */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Kode Formulir Dokumen
                                </label>
                                <input
                                    type="text"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value)}
                                    placeholder="Contoh: F-6.3 (04) Rev 02"
                                    className="input input-bordered input-sm w-full font-mono text-xs"
                                />
                            </div>

                            {/* Persyaratan Suhu & Kelembaban */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Persyaratan Suhu
                                    </label>
                                    <input
                                        type="text"
                                        value={tempReq}
                                        onChange={(e) => setTempReq(e.target.value)}
                                        placeholder="15 - 28 °C"
                                        className="input input-bordered input-sm w-full text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Persyaratan Kelembaban
                                    </label>
                                    <input
                                        type="text"
                                        value={humReq}
                                        onChange={(e) => setHumReq(e.target.value)}
                                        placeholder="40 - 60%"
                                        className="input input-bordered input-sm w-full text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personel Signatures Block */}
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 space-y-3.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-blue-600">badge</span>
                                    Penyelia & Penanggung Jawab
                                </h4>
                                {pjList.length > 0 && (
                                    <span className="badge badge-sm badge-ghost text-[10px] text-gray-500">
                                        Tersinkron Database
                                    </span>
                                )}
                            </div>

                            {/* Pilih Bagian / Lab Shortcut */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Pilih Lab / Bagian
                                </label>
                                <select
                                    value={selectedLab}
                                    onChange={(e) => handleLabChange(e.target.value)}
                                    className="select select-bordered select-sm w-full text-xs"
                                >
                                    <option value="">-- Sesuaikan Sendiri / Pilih Lab --</option>
                                    {pjList.map((p) => (
                                        <option key={p.id} value={p.laboratorium}>
                                            {p.laboratorium} (Penyelia: {p.penyelia})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Penyelia Laboratorium (Editable) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Penyelia Laboratorium <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={penyelia}
                                    onChange={(e) => setPenyelia(e.target.value)}
                                    placeholder="Nama Penyelia Laboratorium..."
                                    className="input input-bordered input-sm w-full font-medium"
                                />
                                <span className="text-[10px] text-gray-500 mt-0.5 block">
                                    Tercetak di bagian kiri bawah lembar pemantauan.
                                </span>
                            </div>

                            {/* Penanggung Jawab Ruangan (Editable) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Penanggung Jawab Ruangan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={penanggungJawab}
                                    onChange={(e) => setPenanggungJawab(e.target.value)}
                                    placeholder="Nama Penanggung Jawab Ruangan..."
                                    className="input input-bordered input-sm w-full font-medium"
                                />
                                <span className="text-[10px] text-gray-500 mt-0.5 block">
                                    Tercetak di bagian kanan bawah lembar pemantauan.
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={updatePreview}
                            disabled={isGenerating || isLoadingData}
                            className="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Perbarui Pratinjau PDF
                        </button>
                    </div>

                    {/* Right Panel: Live PDF Preview (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative min-h-[460px]">
                        <div className="bg-gray-800 text-gray-200 px-4 py-2 flex items-center justify-between text-xs">
                            <span className="font-semibold flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-emerald-400">visibility</span>
                                Pratinjau Cetak Legal Landscape
                            </span>
                            <span className="text-[11px] text-gray-400">1008 x 612 pt (14 x 8.5 inci)</span>
                        </div>

                        {isLoadingData || isGenerating ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500">
                                <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
                                <p className="text-sm font-medium">Memproses data grafik dan menyusun formulir PDF...</p>
                            </div>
                        ) : previewPdfUrl ? (
                            <iframe
                                src={previewPdfUrl}
                                title="Pratinjau PDF Form F-6.3"
                                className="w-full flex-1 border-0 min-h-[440px]"
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
                                <span className="material-symbols-outlined text-5xl mb-2 text-gray-300">
                                    picture_as_pdf
                                </span>
                                <p className="text-sm">Klik &quot;Perbarui Pratinjau PDF&quot; untuk melihat hasil cetak.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                        Pastikan ruangan dan nama personel telah sesuai sebelum mencetak formulir.
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost btn-sm"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={isGenerating || isLoadingData || !selectedRoomId}
                            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Download PDF Formulir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
