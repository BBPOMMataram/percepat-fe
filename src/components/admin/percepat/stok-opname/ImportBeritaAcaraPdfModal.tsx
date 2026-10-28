'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
    UploadCloud,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    Save,
    RotateCcw,
    Search,
    ChevronRight,
    Building2,
    Calendar,
    Tag,
    Layers,
    Info,
    Edit3,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import api from '@/utils/api';
import { useDispatch } from 'react-redux';
import { showAlert } from '@/features/alertSlice';
import { AppDispatch } from '@/redux/store';

import { parsePdfDocumentDynamic, parseIndoDateToIso } from '@/utils/dynamicPdfParser';

dayjs.locale('id');

export interface ParsedPdfItem {
    id: string; // generated temp id
    no: string;
    code: string;
    name: string;
    stock: number;
    satuan: string;
    expired: string | null;
    lokasi: string;
    barang_type: 'reagen' | 'baku-pembanding' | 'atk' | 'suku-cadang';
    subKelompokAsal: string;
}

interface ImportBeritaAcaraPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORY_META = {
    reagen: {
        label: 'Reagen',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        activeTabClass: 'bg-blue-600 text-white',
        defaultSatuan: 'Botol',
        defaultLokasi: 'Gudang Reagen',
        hasExpired: true,
    },
    'baku-pembanding': {
        label: 'Baku Pembanding',
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        activeTabClass: 'bg-indigo-600 text-white',
        defaultSatuan: 'Vial',
        defaultLokasi: 'Kulkas / Suhu Ruang',
        hasExpired: true,
    },
    atk: {
        label: 'ATK',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        activeTabClass: 'bg-emerald-600 text-white',
        defaultSatuan: 'Pcs',
        defaultLokasi: 'Gudang ATK',
        hasExpired: false,
    },
    'suku-cadang': {
        label: 'Suku Cadang',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        activeTabClass: 'bg-purple-600 text-white',
        defaultSatuan: 'Pcs',
        defaultLokasi: 'Gudang Suku Cadang',
        hasExpired: false,
    },
};

export default function ImportBeritaAcaraPdfModal({
    isOpen,
    onClose,
    onSuccess,
}: ImportBeritaAcaraPdfModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parsing state
    const [isParsing, setIsParsing] = useState(false);
    const [parseProgress, setParseProgress] = useState({ current: 0, total: 0 });
    const [fileName, setFileName] = useState('');
    const [nomorBA, setNomorBA] = useState('');
    const [tanggalBA, setTanggalBA] = useState(dayjs().format('YYYY-MM-DD'));

    // Parsed Items
    const [parsedItems, setParsedItems] = useState<ParsedPdfItem[]>([]);

    // Review / Filter state
    const [activeTab, setActiveTab] = useState<'reagen' | 'baku-pembanding' | 'atk' | 'suku-cadang'>('reagen');
    const [searchTable, setSearchTable] = useState('');
    const [stockMode, setStockMode] = useState<'replace' | 'add'>('replace');

    // Category Approval state (setiap kategori bisa disetujui satu per satu)
    const [approvedCategories, setApprovedCategories] = useState<{
        reagen: boolean;
        'baku-pembanding': boolean;
        atk: boolean;
        'suku-cadang': boolean;
    }>({
        reagen: false,
        'baku-pembanding': false,
        atk: false,
        'suku-cadang': false,
    });

    // Tracking kategori yang sudah sukses disimpan ke master
    const [savedCategories, setSavedCategories] = useState<{
        reagen: boolean;
        'baku-pembanding': boolean;
        atk: boolean;
        'suku-cadang': boolean;
    }>({
        reagen: false,
        'baku-pembanding': false,
        atk: false,
        'suku-cadang': false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to dynamically load client-side PDF.js without Turbopack/Canvas bundling issues
    const getPdfJs = async (): Promise<any> => {
        if (typeof window === 'undefined') return null;
        if ((window as any).pdfjsLib) {
            const lib = (window as any).pdfjsLib;
            lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
            return lib;
        }

        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector('script[src="/pdf.min.js"]');
            if (existingScript) {
                const checkInterval = setInterval(() => {
                    const lib = (window as any).pdfjsLib;
                    if (lib) {
                        clearInterval(checkInterval);
                        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
                        resolve(lib);
                    }
                }, 50);
                setTimeout(() => {
                    clearInterval(checkInterval);
                    const lib = (window as any).pdfjsLib;
                    if (lib) resolve(lib);
                    else reject(new Error('Timeout memuat PDF.js'));
                }, 5000);
                return;
            }

            const script = document.createElement('script');
            script.src = '/pdf.min.js';
            script.async = true;
            script.onload = () => {
                const lib = (window as any).pdfjsLib;
                if (lib) {
                    lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
                    resolve(lib);
                } else {
                    reject(new Error('PDF.js library tidak ditemukan di window'));
                }
            };
            script.onerror = () => reject(new Error('Gagal memuat script /pdf.min.js'));
            document.head.appendChild(script);
        });
    };

    // Handle File Selection and Parsing
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            dispatch(showAlert({
                type: 'error',
                message: 'Format File Salah',
                description: 'Silakan pilih file dokumen PDF Berita Acara Stok Opname.',
            }));
            return;
        }

        setFileName(file.name);
        setIsParsing(true);
        setParsedItems([]);
        setApprovedCategories({
            reagen: false,
            'baku-pembanding': false,
            atk: false,
            'suku-cadang': false,
        });
        setSavedCategories({
            reagen: false,
            'baku-pembanding': false,
            atk: false,
            'suku-cadang': false,
        });

        try {
            const result = await parsePdfDocumentDynamic(file, (curr, tot) => {
                setParseProgress({ current: curr, total: tot });
            });

            if (result.nomorDokumen) setNomorBA(result.nomorDokumen);
            if (result.tanggalDokumen) setTanggalBA(parseIndoDateToIso(result.tanggalDokumen));

            const mapped: ParsedPdfItem[] = result.items.map((it) => ({
                id: it.id,
                no: it.no,
                code: it.code,
                name: it.name,
                stock: it.stock,
                satuan: it.satuan,
                expired: it.expired,
                lokasi: it.lokasi,
                barang_type: (it.barang_type === 'perlengkapan' ? 'atk' : it.barang_type) as any,
                subKelompokAsal: it.subKelompokAsal || 'Persediaan',
            }));

            setParsedItems(mapped);

            dispatch(showAlert({
                type: 'success',
                message: 'Parsing PDF Berhasil',
                description: `Berhasil mendeteksi ${result.totalItems} data barang dari ${result.totalPages} halaman dokumen Berita Acara.`,
            }));
        } catch (err: any) {
            console.error('Failed to parse PDF', err);
            dispatch(showAlert({
                type: 'error',
                message: 'Gagal Membaca PDF',
                description: err.message || 'Dokumen PDF tidak dapat dibaca atau formatnya tidak sesuai.',
            }));
        } finally {
            setIsParsing(false);
        }
    };

    // Filter items according to active tab and search query
    const itemsByActiveTab = useMemo(() => {
        return parsedItems.filter(item => item.barang_type === activeTab);
    }, [parsedItems, activeTab]);

    const filteredItems = useMemo(() => {
        if (!searchTable.trim()) return itemsByActiveTab;
        const q = searchTable.toLowerCase().trim();
        return itemsByActiveTab.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.lokasi.toLowerCase().includes(q)
        );
    }, [itemsByActiveTab, searchTable]);

    // Counters per Category
    const categoryCounts = useMemo(() => {
        return {
            reagen: parsedItems.filter(i => i.barang_type === 'reagen').length,
            'baku-pembanding': parsedItems.filter(i => i.barang_type === 'baku-pembanding').length,
            atk: parsedItems.filter(i => i.barang_type === 'atk').length,
            'suku-cadang': parsedItems.filter(i => i.barang_type === 'suku-cadang').length,
        };
    }, [parsedItems]);

    // Handle Inline Edit on Parsed Item
    const handleUpdateItemField = (id: string, field: keyof ParsedPdfItem, value: any) => {
        setParsedItems(prev =>
            prev.map(it => {
                if (it.id === id) {
                    return { ...it, [field]: value };
                }
                return it;
            })
        );
    };

    // Toggle Category Approval
    const toggleApproveCategory = (cat: 'reagen' | 'baku-pembanding' | 'atk' | 'suku-cadang') => {
        setApprovedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat],
        }));
    };

    // Check how many items in approved categories are ready to be saved (excluding already saved)
    const totalApprovedCount = useMemo(() => {
        let count = 0;
        if (approvedCategories.reagen && !savedCategories.reagen) count += categoryCounts.reagen;
        if (approvedCategories['baku-pembanding'] && !savedCategories['baku-pembanding']) count += categoryCounts['baku-pembanding'];
        if (approvedCategories.atk && !savedCategories.atk) count += categoryCounts.atk;
        if (approvedCategories['suku-cadang'] && !savedCategories['suku-cadang']) count += categoryCounts['suku-cadang'];
        return count;
    }, [approvedCategories, savedCategories, categoryCounts]);

    // Submit Approved Items to Backend
    const handleApplyImport = async () => {
        // Collect items from approved categories that are not yet saved
        const approvedItems = parsedItems.filter(
            item => approvedCategories[item.barang_type] === true && !savedCategories[item.barang_type]
        );

        if (approvedItems.length === 0) {
            dispatch(showAlert({
                type: 'error',
                message: 'Belum Ada Kategori Baru Disetujui',
                description: 'Silakan klik tombol "Setujui" pada kategori yang ingin Anda simpan ke database master.',
            }));
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                barang_type: 'all',
                stock_mode: stockMode,
                catat_opname: true,
                tanggal_opname: tanggalBA,
                keterangan: `Import Berita Acara Stok Opname (${nomorBA || fileName || 'PDF'})`,
                items: approvedItems.map(it => ({
                    name: it.name,
                    code: it.code,
                    kode_baru: it.barang_type === 'baku-pembanding' && !/^\d{6}$/.test(it.code) ? it.code : null,
                    stock: it.stock,
                    satuan: it.satuan,
                    expired: it.expired,
                    lokasi: it.lokasi,
                    barang_type: it.barang_type,
                    keterangan: `Hasil Stok Opname Fisik BA (${it.stock} ${it.satuan})`,
                })),
            };

            const res = await api.post('/api/v1/master/import-items', payload);

            // Mark categories as saved
            const newlySaved = { ...savedCategories };
            (['reagen', 'baku-pembanding', 'atk', 'suku-cadang'] as const).forEach(cat => {
                if (approvedCategories[cat]) {
                    newlySaved[cat] = true;
                }
            });
            setSavedCategories(newlySaved);

            // Uncheck the saved ones from approved
            setApprovedCategories(prev => ({
                reagen: newlySaved.reagen ? false : prev.reagen,
                'baku-pembanding': newlySaved['baku-pembanding'] ? false : prev['baku-pembanding'],
                atk: newlySaved.atk ? false : prev.atk,
                'suku-cadang': newlySaved['suku-cadang'] ? false : prev['suku-cadang'],
            }));

            dispatch(showAlert({
                type: 'success',
                message: 'Kategori Berhasil Disimpan ke Master',
                description: res.data?.message || `Berhasil memperbarui data master dari ${approvedItems.length} barang Berita Acara.`,
            }));

            onSuccess();

            // Check if all categories with items have been saved
            const allSaved = (['reagen', 'baku-pembanding', 'atk', 'suku-cadang'] as const).every(
                cat => newlySaved[cat] || categoryCounts[cat] === 0
            );

            if (allSaved) {
                // If everything in this PDF is saved, close modal
                setTimeout(() => {
                    onClose();
                }, 1200);
            }
        } catch (err: any) {
            console.error('Failed to import items', err);
            dispatch(showAlert({
                type: 'error',
                message: 'Gagal Menyimpan Data',
                description: err.response?.data?.message || err.message || 'Terjadi kesalahan saat menyimpan data master.',
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-auto max-h-[94vh] flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                            <FileText size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                                    Import & Sinkronisasi Berita Acara Stok Opname
                                </h3>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800">
                                    PDF Parser
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Baca file Berita Acara SO (seperti 09_BA SO.pdf), kelompokkan kategori otomatis, dan perbarui stok master.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-5 grow">
                    {/* Upload Box / File Info */}
                    {parsedItems.length === 0 && !isParsing ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all group flex flex-col items-center justify-center space-y-3"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="w-16 h-16 rounded-2xl bg-white text-blue-600 shadow-md border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <UploadCloud size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm sm:text-base text-slate-800">
                                    Pilih File Dokumen Berita Acara (PDF)
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                                    Format dokumen seperti <span className="font-mono font-semibold text-blue-700">09_BA SO.pdf</span> yang memuat gabungan Bahan Baku (Reagen & Baku Pembanding), ATK, dan Suku Cadang.
                                </p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs">
                                Telusuri File Dokumen PDF
                            </span>
                        </div>
                    ) : isParsing ? (
                        <div className="py-12 px-4 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                            <Loader2 size={36} className="animate-spin text-blue-600 mx-auto" />
                            <h4 className="font-bold text-sm text-slate-800">
                                Sedang Membaca & Mengekstrak Dokumen Berita Acara...
                            </h4>
                            <p className="text-xs text-slate-500 font-mono">
                                Memproses halaman {parseProgress.current} dari {parseProgress.total} halaman...
                            </p>
                            <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-150"
                                    style={{
                                        width: `${parseProgress.total ? (parseProgress.current / parseProgress.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Parsed Results Section */
                        <div className="space-y-4">
                            {/* Top Document Summary Card */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-700">
                                    <div>
                                        <span className="text-slate-400 font-medium">Dokumen:</span>{' '}
                                        <span className="font-bold text-slate-900">{fileName}</span>
                                    </div>
                                    {nomorBA && (
                                        <div>
                                            <span className="text-slate-400 font-medium">Nomor BA:</span>{' '}
                                            <span className="font-mono font-bold text-blue-700">{nomorBA}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-slate-400 font-medium">Total Item:</span>{' '}
                                        <span className="font-bold text-emerald-700">{parsedItems.length} Barang</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-slate-500 font-medium">Tgl Opname:</span>
                                        <input
                                            type="date"
                                            value={tanggalBA}
                                            onChange={e => setTanggalBA(e.target.value)}
                                            className="px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setParsedItems([]);
                                            setFileName('');
                                        }}
                                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <RotateCcw size={13} />
                                        Ganti File
                                    </button>
                                </div>
                            </div>

                            {/* Category Filter Tabs & Approval Status */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Layers size={14} className="text-blue-600" />
                                        Filter Kategori & Persetujuan (Review Per Kategori):
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        *Setujui kategori untuk mengizinkan penyimpanan ke database
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                    {(['reagen', 'baku-pembanding', 'atk', 'suku-cadang'] as const).map(catKey => {
                                        const count = categoryCounts[catKey];
                                        const isSaved = savedCategories[catKey];
                                        const isApproved = approvedCategories[catKey];
                                        const isCurrent = activeTab === catKey;

                                        return (
                                            <div
                                                key={catKey}
                                                onClick={() => setActiveTab(catKey)}
                                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative ${
                                                    isCurrent
                                                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30'
                                                        : isSaved
                                                            ? 'border-emerald-200 bg-emerald-50/20'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-1 mb-1">
                                                    <span className="text-xs font-bold text-slate-900">
                                                        {CATEGORY_META[catKey].label}
                                                    </span>
                                                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${CATEGORY_META[catKey].badgeClass}`}>
                                                        {count} item
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                                                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                                        isSaved
                                                            ? 'text-emerald-700'
                                                            : isApproved
                                                                ? 'text-blue-700'
                                                                : 'text-slate-400'
                                                    }`}>
                                                        <CheckCircle2
                                                            size={13}
                                                            className={isSaved || isApproved ? (isSaved ? 'text-emerald-600' : 'text-blue-600') : 'text-slate-300'}
                                                        />
                                                        {isSaved ? 'Tersimpan' : isApproved ? 'Disetujui' : 'Belum Disetujui'}
                                                    </span>

                                                    {isSaved ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            ✓ Selesai
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleApproveCategory(catKey);
                                                            }}
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                                                isApproved
                                                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            {isApproved ? 'Batal' : 'Setujui'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Table Toolbar & Active Category Indicator */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                                        <span>Daftar {CATEGORY_META[activeTab].label}</span>
                                        <span className="font-mono text-xs text-slate-400">
                                            ({filteredItems.length} dari {itemsByActiveTab.length} barang)
                                        </span>
                                    </h4>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                        savedCategories[activeTab]
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : approvedCategories[activeTab]
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {savedCategories[activeTab]
                                            ? '✓ Sudah Disimpan ke Master'
                                            : approvedCategories[activeTab]
                                                ? '✓ Kategori Disetujui'
                                                : 'Belum Disetujui'}
                                    </span>
                                </div>

                                <div className="relative w-full sm:w-64">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTable}
                                        onChange={e => setSearchTable(e.target.value)}
                                        placeholder={`Cari di ${CATEGORY_META[activeTab].label}...`}
                                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Editable Items Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                <div className="max-h-80 overflow-y-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                                            <tr>
                                                <th className="py-2.5 px-3 w-12 text-center">No</th>
                                                <th className="py-2.5 px-3 w-24">Kode</th>
                                                <th className="py-2.5 px-3">Nama Barang</th>
                                                <th className="py-2.5 px-3 w-24 text-center">Stok BA SO</th>
                                                <th className="py-2.5 px-3 w-28">Satuan (Edit)</th>
                                                {CATEGORY_META[activeTab].hasExpired && (
                                                    <th className="py-2.5 px-3 w-32">Expired (Edit)</th>
                                                )}
                                                <th className="py-2.5 px-3 w-40">Lokasi Rak Gudang (Edit)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700">
                                            {filteredItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-8 text-center text-slate-400">
                                                        Tidak ada data barang pada kategori ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredItems.map((row, idx) => (
                                                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="py-2 px-3 font-mono font-medium text-blue-700 text-[11px]">
                                                            {row.code || '-'}
                                                        </td>
                                                        <td className="py-2 px-3 font-semibold text-slate-900">
                                                            {row.name}
                                                        </td>
                                                        <td className="py-2 px-3 text-center font-mono font-black text-slate-900 bg-slate-50/50">
                                                            {row.stock}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            <input
                                                                type="text"
                                                                value={row.satuan}
                                                                onChange={e => handleUpdateItemField(row.id, 'satuan', e.target.value)}
                                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white hover:border-slate-300 focus:border-blue-500 focus:outline-hidden"
                                                            />
                                                        </td>
                                                        {CATEGORY_META[activeTab].hasExpired && (
                                                            <td className="py-2 px-3">
                                                                <input
                                                                    type="date"
                                                                    value={row.expired || ''}
                                                                    onChange={e => handleUpdateItemField(row.id, 'expired', e.target.value)}
                                                                    className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded bg-white hover:border-slate-300 focus:border-blue-500 focus:outline-hidden"
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="py-2 px-3">
                                                            <input
                                                                type="text"
                                                                value={row.lokasi}
                                                                onChange={e => handleUpdateItemField(row.id, 'lokasi', e.target.value)}
                                                                placeholder="Lokasi gudang..."
                                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white hover:border-slate-300 focus:border-blue-500 focus:outline-hidden"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notice / Information box */}
                            <div className="flex items-start gap-2.5 p-3 bg-blue-50/60 border border-blue-200/60 rounded-xl text-xs text-blue-900">
                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <span className="font-bold">Informasi Sinkronisasi Master:</span>
                                    <p className="text-[11px] text-blue-800 leading-relaxed">
                                        Data barang yang cocok dengan nama master akan diperbarui stok fisiknya. Barang baru yang belum ada akan didaftarkan otomatis ke masing-masing kategori master di database. Anda dapat menyetujui kategori satu per satu atau sekaligus sebelum menyimpan.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        {parsedItems.length > 0 && (
                            <>
                                <span className="font-semibold text-slate-800">
                                    {totalApprovedCount} dari {parsedItems.length} barang
                                </span>{' '}
                                telah disetujui untuk di-import.
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
                        >
                            Tutup
                        </button>

                        {parsedItems.length > 0 && (
                            <button
                                type="button"
                                onClick={handleApplyImport}
                                disabled={isSubmitting || totalApprovedCount === 0}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        Menyimpan ke Master...
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} />
                                        Simpan & Terapkan ke Master ({totalApprovedCount} Barang)
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
