'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { Printer, Download, X, QrCode, Tag, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import api from '@/utils/api';

dayjs.locale('id');

export interface LabelStikerItem {
    id: number | string;
    name: string;
    code?: string;
    kode_baru?: string;
    letak?: string;
    satuan?: string;
    expired?: string | null;
    diterima_tanggal?: string | null;
    diterima_penerima?: string | null;
    diterima_lab?: string | null;
    category: 'reagen' | 'baku-pembanding';
    isFromPermintaan?: boolean;
    isFromMaster?: boolean;
}

interface LabelStikerModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: LabelStikerItem | null;
}

export default function LabelStikerModal({ isOpen, onClose, item }: LabelStikerModalProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [detailItem, setDetailItem] = useState<LabelStikerItem | null>(null);
    const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
    const [labelMode, setLabelMode] = useState<'master' | 'permintaan'>('master');
    const stickerRef = useRef<HTMLDivElement>(null);

    // Format date in Indonesian short style: e.g. "30-Agu-25"
    const formatIndoDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        const d = dayjs(dateStr);
        if (!d.isValid()) return dateStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = d.format('DD');
        const month = months[d.month()];
        const year = d.format('YY');
        return `${day}-${month}-${year}`;
    };

    // Format full date: e.g. "21 September 2026"
    const formatLongDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        const d = dayjs(dateStr);
        if (!d.isValid()) return dateStr;
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${d.format('DD')} ${months[d.month()]} ${d.format('YYYY')}`;
    };

    useEffect(() => {
        if (!isOpen || !item) return;

        setDetailItem(item);

        // Determine initial label mode
        if (item.isFromMaster) {
            setLabelMode('master');
        } else if (item.isFromPermintaan) {
            setLabelMode('permintaan');
        } else if (item.diterima_penerima || item.diterima_tanggal || item.diterima_lab) {
            setLabelMode('permintaan');
        } else {
            setLabelMode('master');
        }

        // Target URL for scanning: directed to percepat-new public page
        const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const origin = configuredOrigin || currentOrigin;
        const targetUrl = `${origin}/percepat-new/${item.category}/${item.id}`;

        QRCode.toDataURL(targetUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 240,
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
        })
            .then((url) => setQrDataUrl(url))
            .catch((err) => console.error('Failed to generate QR code', err));

        // Fetch fresh detail from backend for expiry, kode_baru, lab, etc.
        setLoadingDetail(true);
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT || '';
        api.get(`${backendBase}/api/v1/detail/${item.category}/${item.id}`)
            .then((res: any) => {
                if (res.data) {
                    setDetailItem((prev) => {
                        const current = prev || item;
                        let finalTanggal: string | null = null;
                        let finalPenerima: string | null = null;
                        let finalLab: string | null = null;

                        if (item.isFromMaster) {
                            finalTanggal = null;
                            finalPenerima = null;
                            finalLab = null;
                        } else if (item.isFromPermintaan) {
                            finalTanggal = item.diterima_tanggal || null;
                            finalPenerima = item.diterima_penerima || null;
                            finalLab = item.diterima_lab || null;
                        } else {
                            finalTanggal = res.data.diterima_tanggal || null;
                            finalPenerima = res.data.diterima_penerima || null;
                            finalLab = res.data.diterima_lab || null;
                        }

                        return {
                            ...current,
                            diterima_tanggal: finalTanggal,
                            diterima_penerima: finalPenerima,
                            diterima_lab: finalLab,
                            expired: res.data.expired ?? current.expired,
                            kode_baru: res.data.kode_baru ?? current.kode_baru,
                            letak: res.data.letak ?? current.letak,
                            code: res.data.code ?? current.code,
                            name: res.data.name ?? current.name,
                        };
                    });
                }
            })
            .catch((err: any) => {
                console.log('Using default item receipt info', err);
            })
            .finally(() => setLoadingDetail(false));
    }, [isOpen, item]);

    if (!isOpen || !item) return null;

    const currentItem = detailItem || item;
    const isMaster = labelMode === 'master';

    const handlePrint = () => {
        window.print();
    };

    // Download high-resolution PNG using canvas drawing
    const handleDownloadPng = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sticker dimensions (scaled for crisp print quality)
        // Master label is compact (800 x 330 px)
        // Permintaan label is full (800 x 680 px)
        canvas.width = 800;
        canvas.height = isMaster ? 330 : 680;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border: rounded blue box
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 6;
        const radius = 24;
        const x = 16, y = 16, w = canvas.width - 32, h = canvas.height - 32;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.stroke();

        // Load QR Code onto canvas
        const qrImg = new window.Image();
        qrImg.crossOrigin = 'anonymous';
        qrImg.onload = () => {
            // Draw QR Code
            ctx.drawImage(qrImg, 40, 40, 180, 180);

            // Right header: BPOM & Expired Date
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.fillText('BADAN POM', 450, 75);

            ctx.fillStyle = '#0369a1';
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillText('Expired Date', 430, 130);

            ctx.fillStyle = '#0f172a';
            ctx.font = '900 38px Arial, sans-serif';
            const expFormatted = formatIndoDate(currentItem.expired);
            ctx.fillText(expFormatted, 430, 180);

            // Divider line before item name
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(40, 240);
            ctx.lineTo(canvas.width - 40, 240);
            ctx.stroke();

            // Item Name subtitle (fine print)
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 18px Arial, sans-serif';
            const identifier = currentItem.kode_baru || currentItem.code || `ID #${currentItem.id}`;
            const locationPart = currentItem.letak ? ` [${currentItem.letak}]` : '';
            const fullTitle = `${identifier}${locationPart}: ${currentItem.name}`;
            const truncatedName = fullTitle.length > 55 ? fullTitle.slice(0, 52) + '...' : fullTitle;
            ctx.fillText(truncatedName, 40, 275);

            // If PERMINTAAN MODE, render the additional Lab receipt sections
            if (!isMaster) {
                // Section: DITERIMA DI LAB
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 22px Arial, sans-serif';
                ctx.fillText('D I T E R I M A   D I   L A B', 230, 325);

                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.fillText('T A N G G A L   :', 60, 365);
                if (currentItem.diterima_tanggal) {
                    ctx.font = 'normal 18px Arial, sans-serif';
                    ctx.fillText(formatLongDate(currentItem.diterima_tanggal), 250, 365);
                } else {
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(250, 365);
                    ctx.lineTo(700, 365);
                    ctx.stroke();
                }

                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.fillText('P E N E R I M A :', 60, 405);
                if (currentItem.diterima_penerima) {
                    ctx.font = 'normal 18px Arial, sans-serif';
                    ctx.fillText(currentItem.diterima_penerima, 250, 405);
                } else {
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(250, 405);
                    ctx.lineTo(700, 405);
                    ctx.stroke();
                }

                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.fillText('D I   L A B     :', 60, 445);
                if (currentItem.diterima_lab) {
                    ctx.font = 'normal 18px Arial, sans-serif';
                    ctx.fillText(currentItem.diterima_lab, 250, 445);
                } else {
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(250, 445);
                    ctx.lineTo(700, 445);
                    ctx.stroke();
                }

                // Middle Divider
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(35, 480);
                ctx.lineTo(canvas.width - 35, 480);
                ctx.stroke();

                // Section: DIBUKA
                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.fillText('D I B U K A', 60, 515);

                ctx.fillText('O L E H          :', 60, 555);
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(250, 555);
                ctx.lineTo(700, 555);
                ctx.stroke();

                ctx.fillText('T A N G G A L :', 60, 595);
                ctx.beginPath();
                ctx.moveTo(250, 595);
                ctx.lineTo(700, 595);
                ctx.stroke();

                // Bottom pill badge: BPOM DI MATARAM
                ctx.fillStyle = '#f0f9ff';
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 2;
                const badgeW = 220, badgeH = 34, bx = canvas.width - badgeW - 50, by = 620;
                ctx.beginPath();
                ctx.roundRect(bx, by, badgeW, badgeH, 17);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#0369a1';
                ctx.font = 'bold 16px Arial, sans-serif';
                ctx.fillText('BPOM DI MATARAM', bx + 22, by + 23);
            }

            // Trigger download
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `Label-${isMaster ? 'Master' : 'Permintaan'}-${currentItem.category}-${currentItem.id}.png`;
            link.href = dataUrl;
            link.click();
        };
        qrImg.src = qrDataUrl;
    };

    return (
        <>
            {/* Print CSS injected dynamically */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #print-sticker-container, #print-sticker-container * {
                        visibility: visible !important;
                    }
                    #print-sticker-container {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 90mm !important;
                        max-width: 90mm !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        z-index: 99999 !important;
                    }
                }
            `}</style>

            {/* Pure Light Theme Modal Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
                <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 my-auto sm:my-8 max-h-[92vh] flex flex-col">
                    
                    {/* Header: Pure Light */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/80 border-b border-slate-200 shrink-0">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                            <span className="p-2 bg-sky-100 text-sky-700 rounded-xl border border-sky-200/60 shadow-xs shrink-0">
                                <QrCode size={18} />
                            </span>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <h3 className="font-bold text-sm sm:text-base md:text-lg text-slate-900 leading-tight truncate">
                                        Label Tempelan Botol
                                    </h3>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wide">
                                        {currentItem.category === 'baku-pembanding' ? 'Baku Pembanding' : 'Reagen'}
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                                    {isMaster
                                        ? 'Format label master gudang untuk opname persediaan'
                                        : 'Format label penyerahan lab lengkap paraf & lab'}
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

                    {/* Preview Box: Clean Soft Light Gray Canvas */}
                    <div className="p-3 sm:p-6 bg-slate-100/70 border-b border-slate-200 flex flex-col justify-center items-center gap-3.5 overflow-x-auto max-w-full grow">
                        
                        {/* Mode Selector Tabs (Master vs Permintaan) */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold shadow-inner w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setLabelMode('master')}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                                    isMaster
                                        ? 'bg-white text-sky-700 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Tag size={13} />
                                <span>Label Master (Gudang & Opname)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLabelMode('permintaan')}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                                    !isMaster
                                        ? 'bg-white text-sky-700 shadow-xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <CheckCircle2 size={13} />
                                <span>Label Selesai Permintaan (Lab)</span>
                            </button>
                        </div>

                        {/* Printable Sticker Card */}
                        <div
                            id="print-sticker-container"
                            ref={stickerRef}
                            className="w-full max-w-[360px] sm:w-[370px] bg-white text-slate-900 border-2 border-sky-600 rounded-xl p-3 sm:p-3.5 shadow-md font-sans text-xs select-none transition-all"
                        >
                            {/* Top Row: QR Code + BADAN POM & Expired Date */}
                            <div className="flex items-center justify-between gap-3 pb-2">
                                {/* QR Code with subtle border */}
                                <div className="w-[102px] h-[102px] shrink-0 border border-slate-200 rounded p-1 bg-white flex items-center justify-center">
                                    {qrDataUrl ? (
                                        <img
                                            src={qrDataUrl}
                                            alt="QR Code Barang"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
                                    )}
                                </div>

                                {/* Right: Logo + Expired Date */}
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    {/* Logo BPOM */}
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <div className="relative w-8 h-8">
                                            <Image
                                                src="/assets/images/bpom_without_label.webp"
                                                alt="BPOM"
                                                fill
                                                className="object-contain"
                                                sizes="32px"
                                            />
                                        </div>
                                        <span className="font-extrabold text-[13px] tracking-tight text-slate-800">
                                            BADAN POM
                                        </span>
                                    </div>

                                    {/* Expired Date Title & Value */}
                                    <div className="font-black text-[15px] text-slate-900 tracking-tight leading-none mt-1">
                                        Expired Date
                                    </div>
                                    <div className="font-black text-[17px] text-slate-900 tracking-tight mt-1">
                                        {formatIndoDate(currentItem.expired)}
                                    </div>
                                </div>
                            </div>

                            {/* Item Identifier fine print (Kode & Nama Barang) */}
                            <div className="text-[10px] text-slate-700 font-medium truncate border-t border-slate-200 pt-1.5 pb-0.5 leading-snug">
                                <span className="font-extrabold text-slate-900">
                                    {currentItem.kode_baru || currentItem.code || `ID #${currentItem.id}`}:
                                </span>{' '}
                                {currentItem.name}
                                {currentItem.letak && (
                                    <span className="text-slate-500 font-normal ml-1">
                                        (Lokasi: {currentItem.letak})
                                    </span>
                                )}
                            </div>

                            {/* Additional metadata for master labeling */}
                            {isMaster && (
                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1">
                                    <span>ID Barang: #{currentItem.id}</span>
                                    <span>BPOM DI MATARAM</span>
                                </div>
                            )}

                            {/* EXCLUSIVE FOR PERMINTAAN LAB: DITERIMA DI LAB + DIBUKA + BADGE */}
                            {!isMaster && (
                                <>
                                    {/* DITERIMA DI LAB section */}
                                    <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                                        <div className="text-center font-bold text-[11px] tracking-[0.25em] text-slate-900 mb-1.5">
                                            D I T E R I M A &nbsp; D I &nbsp; L A B
                                        </div>
                                        <div className="space-y-1.5 text-[11px] font-medium text-slate-800 px-1">
                                            <div className="flex items-center">
                                                <span className="w-28 font-bold tracking-wider shrink-0">T A N G G A L :</span>
                                                {currentItem.diterima_tanggal ? (
                                                    <span className="font-semibold text-slate-900 truncate">
                                                        {formatLongDate(currentItem.diterima_tanggal)}
                                                    </span>
                                                ) : (
                                                    <div className="flex-1 border-b border-slate-400 h-3.5" />
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-28 font-bold tracking-wider shrink-0">P E N E R I M A :</span>
                                                {currentItem.diterima_penerima ? (
                                                    <span className="font-semibold text-slate-900 truncate" title={currentItem.diterima_penerima}>
                                                        {currentItem.diterima_penerima}
                                                    </span>
                                                ) : (
                                                    <div className="flex-1 border-b border-slate-400 h-3.5" />
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-28 font-bold tracking-wider shrink-0">D I &nbsp; L A B &nbsp; :</span>
                                                {currentItem.diterima_lab ? (
                                                    <span className="font-semibold text-slate-900 truncate" title={currentItem.diterima_lab}>
                                                        {currentItem.diterima_lab}
                                                    </span>
                                                ) : (
                                                    <div className="flex-1 border-b border-slate-400 h-3.5" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thick Horizontal Blue Divider */}
                                    <div className="my-2 border-t-2 border-sky-600" />

                                    {/* DIBUKA section (for physical manual handwriting upon unsealing) */}
                                    <div className="space-y-1.5 text-[11px] font-medium text-slate-800 px-1">
                                        <div className="font-bold tracking-widest text-slate-900">
                                            D I B U K A
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-28 font-bold tracking-wider">O L E H :</span>
                                            <div className="flex-1 border-b border-slate-400 h-4" />
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-28 font-bold tracking-wider">T A N G G A L :</span>
                                            <div className="flex-1 border-b border-slate-400 h-4" />
                                        </div>
                                    </div>

                                    {/* Bottom Footer Badge: BPOM DI MATARAM */}
                                    <div className="mt-2.5 pt-1 flex justify-end">
                                        <div className="inline-flex items-center border border-sky-600 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-sky-800 tracking-wider bg-sky-50">
                                            BPOM DI MATARAM
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer: Pure Light Theme */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-t border-slate-200 shrink-0">
                        <div className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
                            {isMaster
                                ? 'Ukuran cetak ringkas stiker botol gudang (~8x3.5 cm) siap untuk opname'
                                : 'Ukuran cetak botol lab (~8x6.5 cm) dengan paraf buka & lab'}
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                className="flex-1 sm:flex-none justify-center px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs flex items-center gap-1.5 transition-colors"
                                onClick={handleDownloadPng}
                            >
                                <Download size={14} />
                                <span>Unduh PNG</span>
                            </button>
                            <button
                                type="button"
                                className="flex-1 sm:flex-none justify-center px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                                onClick={handlePrint}
                            >
                                <Printer size={14} />
                                <span>Cetak Label</span>
                            </button>
                            <button
                                type="button"
                                className="w-full sm:w-auto justify-center px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                onClick={onClose}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
