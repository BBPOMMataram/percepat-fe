'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
    ArrowLeft,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Calendar,
    MapPin,
    Tag,
    FileText,
    QrCode,
    Printer,
    Building2,
    FlaskConical,
    ShieldAlert,
    Clock,
    Copy,
    Check,
    UserCheck,
} from 'lucide-react';
import api from '@/utils/api';
import LabelStikerModal, { LabelStikerItem } from '../label/LabelStikerModal';

dayjs.locale('id');

interface BakuPembandingDetail {
    id: number;
    name: string;
    code?: string;
    kode_baru?: string;
    letak?: string;
    stock: number;
    satuan: string;
    expired?: string | null;
    msds?: string | boolean;
    diterima_tanggal?: string | null;
    diterima_penerima?: string | null;
    diterima_lab?: string | null;
    created_at?: string;
    updated_at?: string;
}

export default function DetailBakuPembanding() {
    const params = useParams();
    const id = params?.id as string;

    const [data, setData] = useState<BakuPembandingDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [labelModalOpen, setLabelModalOpen] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT || '';
        api.get(`${backendBase}/api/v1/detail/baku-pembanding/${id}`)
            .then((res: any) => {
                setData(res.data);
                setError(null);
            })
            .catch((err: any) => {
                console.error(err);
                setError('Data Baku Pembanding tidak ditemukan atau terjadi kesalahan server.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    const handleCopyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-5xl mx-auto animate-pulse space-y-6">
                    <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-12 bg-slate-200 rounded w-3/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-40 bg-slate-200 rounded-2xl"></div>
                        <div className="h-40 bg-slate-200 rounded-2xl"></div>
                        <div className="h-40 bg-slate-200 rounded-2xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-2xl mx-auto py-16 px-4 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Barang Tidak Ditemukan
                </h1>
                <p className="text-slate-500 mb-6">
                    {error || 'Data Baku Pembanding dengan kode ini tidak tersedia di database.'}
                </p>
                <Link
                    href="/percepat-new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm transition-colors"
                >
                    <ArrowLeft size={16} /> Kembali ke Beranda Percepat
                </Link>
            </div>
        );
    }

    // Expiry status analysis
    const now = dayjs();
    const expDate = data.expired ? dayjs(data.expired) : null;
    const isExpired = expDate ? expDate.isBefore(now) : false;
    const isNearExpired = expDate ? !isExpired && expDate.diff(now, 'month') < 6 : false;
    const daysUntilExp = expDate ? expDate.diff(now, 'day') : null;

    const labelItem: LabelStikerItem = {
        id: data.id,
        name: data.name,
        code: data.code,
        kode_baru: data.kode_baru,
        letak: data.letak,
        satuan: data.satuan,
        expired: data.expired,
        diterima_tanggal: data.diterima_tanggal,
        diterima_penerima: data.diterima_penerima,
        diterima_lab: data.diterima_lab || (data as any)?.bidang?.name || (data as any)?.bidang_name_auth_external || null,
        category: 'baku-pembanding',
        isFromPermintaan: !!data.diterima_tanggal,
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 text-slate-800">
            <div className="max-w-5xl mx-auto">
                {/* Top Navigation & Breadcrumb */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Link
                            href="/percepat-new"
                            className="flex items-center gap-1.5 hover:text-sky-600 transition-colors font-medium text-slate-600"
                        >
                            <ArrowLeft size={16} /> Beranda Percepat
                        </Link>
                        <span>/</span>
                        <span className="text-slate-700 font-medium">Baku Pembanding</span>
                        <span>/</span>
                        <span className="text-slate-400 truncate max-w-[200px]">#{data.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-colors"
                            title="Salin Link Halaman Ini"
                        >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copied ? 'Tersalin!' : 'Salin URL'}
                        </button>
                    </div>
                </div>

                {/* Main Title Card (Pure Light Theme) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6 relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
                        <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                                    <FlaskConical size={14} />
                                    Baku Pembanding Farmasi
                                </span>

                                {isExpired ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                                        <XCircle size={14} /> Kadaluarsa
                                    </span>
                                ) : isNearExpired ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                        <AlertTriangle size={14} /> Mendekati Kadaluarsa (&lt; 6 Bulan)
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 size={14} /> Masa Simpan Valid
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                                {data.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 pt-1">
                                {data.kode_baru && (
                                    <div className="flex items-center gap-1.5 font-mono bg-sky-50 px-2.5 py-1 rounded-lg text-sky-800 font-semibold border border-sky-200">
                                        <Tag size={14} className="text-sky-600" />
                                        Kode Baru: {data.kode_baru}
                                    </div>
                                )}
                                {data.code && (
                                    <div className="flex items-center gap-1.5 font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200/80">
                                        Kode: {data.code}
                                    </div>
                                )}
                                {data.letak && (
                                    <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg text-rose-800 font-semibold border border-rose-200">
                                        <MapPin size={14} className="text-rose-600" />
                                        Lokasi: {data.letak}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stock counter highlight */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-right shrink-0 min-w-[210px]">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Sisa Stok Laboratorium
                            </div>
                            <div className="flex items-baseline justify-end gap-1.5">
                                <span className={`text-4xl font-black ${data.stock > 0 ? 'text-sky-600' : 'text-red-500'}`}>
                                    {data.stock}
                                </span>
                                <span className="text-sm font-bold text-slate-700">
                                    {data.satuan}
                                </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                                {data.stock > 0 ? 'Tersedia untuk pengujian' : 'Stok habis di persediaan'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Information Cards (Pure Light Theme) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                    {/* 1. Expired Date */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                                <Calendar size={20} />
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Kadaluarsa (ED)
                            </span>
                        </div>
                        <div>
                            <div className="text-xl font-black text-slate-900">
                                {data.expired ? dayjs(data.expired).format('DD MMMM YYYY') : 'Tidak Ditentukan'}
                            </div>
                            <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
                                <Clock size={13} />
                                {isExpired
                                    ? 'Sudah kadaluarsa'
                                    : daysUntilExp !== null
                                    ? `${daysUntilExp} hari tersisa`
                                    : '-'}
                            </div>
                        </div>
                    </div>

                    {/* 2. Diterima di Lab (Tanggal Penyerahan & Pemohon) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <span className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                                <Building2 size={20} />
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Diterima di Lab
                            </span>
                        </div>
                        <div>
                            <div className="text-xl font-black text-slate-900">
                                {data.diterima_tanggal ? dayjs(data.diterima_tanggal).format('DD MMMM YYYY') : '-'}
                            </div>
                            <div className="text-xs font-medium text-slate-600 mt-1 flex items-center gap-1.5 truncate" title={data.diterima_penerima || 'Petugas Laboratorium'}>
                                <UserCheck size={14} className="text-sky-600 shrink-0" />
                                <span>Penerima (Pemohon):</span>
                                <span className="font-semibold text-slate-900">{data.diterima_penerima || 'Petugas Laboratorium'}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Letak / Lokasi Penyimpanan */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                                <MapPin size={20} />
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Lokasi Penyimpanan
                            </span>
                        </div>
                        <div>
                            <div className="text-xl font-black text-slate-900">
                                {data.letak || 'Belum Diatur'}
                            </div>
                            <div className="text-xs font-medium text-slate-500 mt-1">
                                Kode Baru: <span className="font-mono font-bold text-slate-800">{data.kode_baru || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticker Label Banner: Light Gradient */}
                <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-2xl p-6 sm:p-7 shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center sm:text-left max-w-xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold uppercase tracking-wider">
                                <QrCode size={14} /> Stiker Baku Pembanding
                            </div>
                            <h2 className="text-xl font-extrabold tracking-tight">
                                Cetak Label untuk Ditempel pada Wadah Baku Pembanding
                            </h2>
                            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
                                Memuat barcode QR, tanggal expired, tanggal diterima di lab, nama pemohon, serta kolom paraf pembukaan segel pertama kali oleh teknisi penguji.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setLabelModalOpen(true)}
                            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-sky-700 font-bold shadow-sm transition-colors inline-flex items-center gap-2 shrink-0 text-sm"
                        >
                            <Printer size={16} />
                            Tampilkan &amp; Cetak Label
                        </button>
                    </div>
                </div>

                {/* SOP Laboratorium Box (Pure Light Theme) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2 mb-3">
                        <ShieldAlert size={18} className="text-amber-500" />
                        Ketentuan Penggunaan Baku Pembanding di Laboratorium
                    </h3>
                    <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5 leading-relaxed">
                        <li>
                            Pastikan stiker label tetap terbaca dan menempel kuat pada wadah penyimpanan.
                        </li>
                        <li>
                            Teknisi yang pertama kali membuka wadah baku pembanding wajib mengisi kolom <strong>DIBUKA OLEH</strong> dan <strong>TANGGAL</strong> pada stiker fisik menggunakan pulpen tahan luntur.
                        </li>
                        <li>
                            Segera simpan kembali baku pembanding pada lokasi penyimpanan: <strong>{data.letak || 'tempat yang telah ditentukan'}</strong> sesuai dengan suhu yang dipersyaratkan.
                        </li>
                        <li>
                            Pengambilan untuk pengujian wajib melalui permohonan form permintaan persediaan resmi.
                        </li>
                    </ul>
                </div>

                {/* Sticker Modal */}
                <LabelStikerModal
                    isOpen={labelModalOpen}
                    onClose={() => setLabelModalOpen(false)}
                    item={labelItem}
                />
            </div>
        </div>
    );
}
