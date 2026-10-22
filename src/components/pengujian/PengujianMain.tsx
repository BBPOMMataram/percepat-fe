"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    BatchItem,
    PengujianItem,
    pengujianService,
} from "./pengujianService";
import { QrModalData } from "./types";
import PengujianHeader from "./header/PengujianHeader";
import PengujianUploadCard from "./upload/PengujianUploadCard";
import PengujianBatchSelector from "./batch/PengujianBatchSelector";
import PengujianTable from "./table/PengujianTable";
import PengujianQrModal from "./modal/PengujianQrModal";
import PengujianFooter from "./footer/PengujianFooter";

export default function PengujianMain() {
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [items, setItems] = useState<PengujianItem[]>([]);
    const [batches, setBatches] = useState<BatchItem[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
    const [currentBatch, setCurrentBatch] = useState<BatchItem | null>(null);
    const [siblingSheets, setSiblingSheets] = useState<BatchItem[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [totalOverall, setTotalOverall] = useState<number>(0);

    // Alerts
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // QR Modal State
    const [qrModalData, setQrModalData] = useState<QrModalData>({
        isOpen: false,
        qrToken: "",
        title: "",
        code: "",
        info: "",
        targetUrl: "",
        pdfUrl: "",
    });

    // Load Data from backend
    const loadData = useCallback(async (batchId?: string) => {
        setLoading(true);
        try {
            const data = await pengujianService.getData(batchId);
            setItems(data.items || []);
            setBatches(data.batches || []);
            setSelectedBatchId(data.selectedBatchId || null);
            setCurrentBatch(data.currentBatch || null);
            setSiblingSheets(data.siblingSheets || []);
            setHeaders(data.headers || []);
            setTotalOverall(data.totalOverall || 0);
        } catch (err: any) {
            console.error("Error loading pengujian data:", err);
            const msg =
                err.response?.data?.message ||
                "Gagal terhubung ke backend pengujian. Pastikan backend di port 8008 aktif.";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle Upload File
    const handleUpload = async (file: File) => {
        setActionLoading(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const res = await pengujianService.uploadFile(file);
            setSuccessMessage(res.message);
            await loadData(res.batch_id);
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                "Gagal memproses file. Pastikan format file sesuai (.xlsx, .xls, .csv, .pdf).";
            setErrorMessage(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Select Batch
    const handleSelectBatch = (batchId: string) => {
        setSelectedBatchId(batchId);
        loadData(batchId);
    };

    // Handle Delete Batch
    const handleDeleteBatch = async (batchId: string) => {
        setActionLoading(true);
        try {
            const res = await pengujianService.deleteBatch(batchId);
            setSuccessMessage(res.message);
            await loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal menghapus batch.";
            setErrorMessage(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Clear All Data (Reset Data)
    const handleClearAll = async () => {
        setActionLoading(true);
        try {
            const res = await pengujianService.clearAll();
            setSuccessMessage(res.message);
            await loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal mengosongkan data.";
            setErrorMessage(msg);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between antialiased">
            {/* INLINE CSS FOR HALO ANIMATIONS & SCROLLBAR (IDENTICAL TO BLADE) */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 9999px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                @keyframes halo-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes halo-pulse {
                    0%, 100% { opacity: 0.55; transform: scale(1); }
                    50% { opacity: 0.85; transform: scale(1.04); }
                }

                .halo-container {
                    position: relative;
                    overflow: hidden;
                    border-radius: 1.25rem;
                    padding: 2px;
                    background: #e2e8f0;
                    box-shadow: 0 4px 20px -2px rgba(0, 91, 170, 0.08);
                    transition: all 0.3s ease;
                }
                .halo-container:hover {
                    box-shadow: 0 8px 30px -4px rgba(0, 91, 170, 0.16);
                }

                .halo-trail {
                    position: absolute;
                    inset: -80%;
                    background: conic-gradient(
                        from 0deg, 
                        transparent 0deg, 
                        transparent 240deg, 
                        rgba(0, 91, 170, 0.4) 280deg, 
                        #005baa 320deg, 
                        #059669 350deg, 
                        #005baa 360deg
                    );
                    animation: halo-spin 7s linear infinite;
                    pointer-events: none;
                    opacity: 0.8;
                }

                .halo-blob-1 {
                    position: absolute;
                    top: -25px;
                    left: 10%;
                    width: 140px;
                    height: 140px;
                    background: radial-gradient(circle, rgba(0, 91, 170, 0.3) 0%, transparent 70%);
                    filter: blur(24px);
                    animation: halo-pulse 4s ease-in-out infinite;
                    pointer-events: none;
                }

                .halo-blob-2 {
                    position: absolute;
                    bottom: -25px;
                    right: 10%;
                    width: 150px;
                    height: 150px;
                    background: radial-gradient(circle, rgba(5, 150, 105, 0.28) 0%, transparent 70%);
                    filter: blur(24px);
                    animation: halo-pulse 4s ease-in-out infinite 2s;
                    pointer-events: none;
                }

                .halo-inner {
                    position: relative;
                    z-index: 1;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-radius: calc(1.25rem - 2px);
                    border: 2px dashed #cbd5e1;
                    transition: all 0.25s ease;
                    cursor: pointer;
                }
                .halo-inner:hover, .halo-inner.dragover {
                    border-color: #005baa;
                    background: rgba(240, 247, 255, 0.98);
                }
                `
            }} />

            <div>
                {/* TOP HEADER */}
                <PengujianHeader
                    totalOverall={totalOverall}
                    loading={loading || actionLoading}
                    onClearAll={handleClearAll}
                />

                {/* MAIN CONTENT */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
                    {/* FLASH NOTIFICATIONS */}
                    {successMessage && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-2xs">
                            <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div className="flex-1 font-medium">{successMessage}</div>
                            <button
                                type="button"
                                onClick={() => setSuccessMessage(null)}
                                className="text-emerald-600 hover:text-emerald-900 font-bold"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-2xs">
                            <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div className="flex-1 font-medium">{errorMessage}</div>
                            <button
                                type="button"
                                onClick={() => setErrorMessage(null)}
                                className="text-rose-600 hover:text-rose-900 font-bold"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {/* SECTION 1: HALO DROPZONE (Excel / CSV / PDF) */}
                    <PengujianUploadCard
                        loading={actionLoading}
                        onUpload={handleUpload}
                    />

                    {/* SECTION 2: BATCH SELECTION & FILTER */}
                    <PengujianBatchSelector
                        batches={batches}
                        selectedBatchId={selectedBatchId}
                        currentBatch={currentBatch}
                        siblingSheets={siblingSheets}
                        hasItems={items.length > 0}
                        onSelectBatch={handleSelectBatch}
                        onDeleteBatch={handleDeleteBatch}
                    />

                    {/* SECTION 3: DATATABLE WITH LIVE SEARCH & PAGINATION */}
                    <PengujianTable
                        items={items}
                        headers={headers}
                        currentBatch={currentBatch}
                        loading={loading || actionLoading}
                        onOpenQrModal={setQrModalData}
                    />
                </main>
            </div>

            {/* FOOTER */}
            <PengujianFooter />

            {/* POPUP MODAL QR CODE BESAR */}
            <PengujianQrModal
                data={qrModalData}
                onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
