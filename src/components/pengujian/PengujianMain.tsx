"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
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
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Alerts
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);

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

    // Load Data
    const loadData = useCallback(async (batchId?: string, query?: string) => {
        setLoading(true);
        try {
            const data = await pengujianService.getData(batchId, query);
            setItems(data.items || []);
            setBatches(data.batches || []);
            setSelectedBatchId(data.selectedBatchId || null);
            setCurrentBatch(data.currentBatch || null);
            setSiblingSheets(data.siblingSheets || []);
            setHeaders(data.headers || []);
            setTotalOverall(data.totalOverall || 0);
            setDbError(data.dbError || null);
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
            toast.success(res.message);
            await loadData(res.batch_id);
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                "Gagal memproses file. Pastikan format file sesuai (.xlsx, .xls, .csv, .pdf).";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Load Sample Data (2col, full, pdf)
    const handleLoadSample = async (type: "2col" | "full" | "pdf") => {
        setActionLoading(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            const res = await pengujianService.loadSample(type);
            setSuccessMessage(res.message);
            toast.success(res.message);
            await loadData(res.batch_id);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal memuat contoh data.";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Select Batch
    const handleSelectBatch = (batchId: string) => {
        setSelectedBatchId(batchId);
        loadData(batchId, searchQuery);
    };

    // Handle Search
    const handleSearch = (q: string) => {
        setSearchQuery(q);
        loadData(selectedBatchId || undefined, q);
    };

    // Handle Delete Batch
    const handleDeleteBatch = async (batchId: string) => {
        setActionLoading(true);
        try {
            const res = await pengujianService.deleteBatch(batchId);
            setSuccessMessage(res.message);
            toast.success(res.message);
            await loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal menghapus batch.";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Clear All Data
    const handleClearAll = async () => {
        setActionLoading(true);
        try {
            const res = await pengujianService.clearAll();
            setSuccessMessage(res.message);
            toast.success(res.message);
            await loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Gagal mengosongkan data.";
            setErrorMessage(msg);
            toast.error(msg);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between antialiased font-sans">
            <div>
                {/* 1. Header */}
                <PengujianHeader
                    totalOverall={totalOverall}
                    loading={loading || actionLoading}
                    onLoadSample={handleLoadSample}
                    onClearAll={handleClearAll}
                />

                {/* Main Content Container */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
                    {/* Flash Notifications */}
                    {successMessage && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start justify-between gap-3 shadow-2xs animate-in fade-in">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-emerald-600 mt-0.5 shrink-0">
                                    check_circle
                                </span>
                                <div className="font-medium">{successMessage}</div>
                            </div>
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
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3 shadow-2xs animate-in fade-in">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-rose-600 mt-0.5 shrink-0">
                                    error
                                </span>
                                <div className="font-medium">{errorMessage}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setErrorMessage(null)}
                                className="text-rose-600 hover:text-rose-900 font-bold"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {dbError && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-3 shadow-2xs">
                            <span className="material-symbols-outlined text-amber-600 mt-0.5 shrink-0">
                                warning
                            </span>
                            <div className="flex-1">
                                <strong className="font-bold">Pemberitahuan Status Database:</strong>
                                <div className="text-xs font-mono mt-1 break-all">{dbError}</div>
                                <div className="text-xs mt-1 text-amber-700">
                                    Database sedang disiapkan atau dimigrasi ulang secara otomatis.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Upload Card */}
                    <PengujianUploadCard
                        loading={actionLoading}
                        onUpload={handleUpload}
                    />

                    {/* 3. Batch Selection & Filter */}
                    <PengujianBatchSelector
                        batches={batches}
                        selectedBatchId={selectedBatchId}
                        currentBatch={currentBatch}
                        siblingSheets={siblingSheets}
                        hasItems={items.length > 0}
                        searchQuery={searchQuery}
                        onSelectBatch={handleSelectBatch}
                        onSearch={handleSearch}
                        onDeleteBatch={handleDeleteBatch}
                    />

                    {/* 4. Data Table */}
                    <PengujianTable
                        items={items}
                        headers={headers}
                        currentBatch={currentBatch}
                        loading={loading || actionLoading}
                        onOpenQrModal={setQrModalData}
                        onLoadSample2Col={() => handleLoadSample("2col")}
                    />
                </main>
            </div>

            {/* 5. Footer */}
            <PengujianFooter />

            {/* 6. Big QR Code Modal */}
            <PengujianQrModal
                data={qrModalData}
                onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
