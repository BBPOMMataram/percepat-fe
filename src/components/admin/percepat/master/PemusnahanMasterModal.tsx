"use client";

import React, { useState } from "react";
import api from "@/utils/api";
import { useDispatch } from "react-redux";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from "lucide-react";

export interface PemusnahanMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    category: "reagen" | "baku-pembanding" | "atk" | "perlengkapan" | "suku-cadang";
    categoryLabel: string;
    totalItemsCount?: number;
    totalItems?: number;
}

export default function PemusnahanMasterModal({
    isOpen,
    onClose,
    onSuccess,
    category,
    categoryLabel,
    totalItemsCount,
    totalItems,
}: PemusnahanMasterModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const itemCount = totalItems !== undefined ? totalItems : totalItemsCount;
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const isMatch = confirmText.trim().toUpperCase() === "PEMUSNAHAN";

    const handleDeleteAll = async () => {
        if (!isMatch) return;
        if (!category) {
            dispatch(
                showAlert({
                    type: "error",
                    message: "Kategori Tidak Valid",
                    description: "Kategori barang yang akan dimusnahkan tidak terdeteksi.",
                })
            );
            return;
        }

        setIsDeleting(true);
        try {
            const res = await api.post("/api/v1/master/pemusnahan", {
                category,
            });

            dispatch(
                showAlert({
                    type: "success",
                    message: "Pemusnahan Berhasil",
                    description: res.data?.message || `Seluruh data ${categoryLabel} telah berhasil dihapus.`,
                })
            );
            setConfirmText("");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Gagal melakukan pemusnahan data:", error);
            dispatch(
                showAlert({
                    type: "error",
                    message: "Gagal Pemusnahan",
                    description: error.response?.data?.message || error.message || "Terjadi kesalahan saat menghapus data.",
                })
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (isDeleting) return;
        setConfirmText("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/70">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-rose-950">
                                Pemusnahan Data Master {categoryLabel}
                            </h3>
                            <p className="text-xs text-rose-600 font-medium">
                                Tindakan pembersihan seluruh inventaris kategori ini
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/80 transition-colors disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Warning Notice Box */}
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-amber-950">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Peringatan Kegiatan Pemusnahan Barang</span>
                        </div>
                        <p>
                            Fitur ini dikhususkan saat adanya <strong>kegiatan pemusnahan barang/persediaan</strong> di BBPOM di Mataram yang menghapus seluruh barang master <strong>{categoryLabel}</strong> yang ada.
                        </p>
                        <p className="text-amber-800">
                            Semua daftar barang di kategori ini akan dihapus dari inventaris. Setelah data bersih, Anda dapat memasukkan kembali data baru dari surat/dokumen pusat melalui tombol <strong>Import Data (Excel & PDF)</strong>.
                        </p>
                    </div>

                    {/* Information summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Kategori Target:</span>
                            <span className="font-semibold text-slate-800">{categoryLabel}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Estimasi Data Dihapus:</span>
                            <span className="font-mono font-bold text-rose-600">
                                {itemCount !== undefined ? `${itemCount} barang` : "Semua barang"}
                            </span>
                        </div>
                    </div>

                    {/* Confirmation Input */}
                    <div className="space-y-2 pt-1">
                        <label className="block text-xs font-medium text-slate-700">
                            Ketik kata <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">PEMUSNAHAN</span> di bawah untuk mengonfirmasi:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Ketik PEMUSNAHAN di sini"
                            disabled={isDeleting}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all uppercase tracking-wider"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleDeleteAll}
                        disabled={!isMatch || isDeleting}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-xs hover:shadow-sm"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menghapus Data...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                <span>Hapus Semua Data</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
