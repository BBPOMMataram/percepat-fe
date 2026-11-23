"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardCheck, Download, FileText, Trash2 } from "lucide-react";
import PengendalianMutuShell from "./PengendalianMutuShell";
import { fetchPengendalianMutuRecords, deletePengendalianMutuRecord, type PengendalianMutuRecord } from "./data";

function checklistCount(record: PengendalianMutuRecord): number {
    return Object.values(record.checklist || {}).filter((answer) => Boolean(answer?.status)).length;
}

export default function PengendalianMutuList() {
    const [records, setRecords] = useState<PengendalianMutuRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [exportingId, setExportingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadRecords = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage("");
        try {
            const data = await fetchPengendalianMutuRecords();
            setRecords(data);
        } catch (error) {
            console.error("Gagal membaca data checklist pengendalian mutu:", error);
            setErrorMessage(error instanceof Error ? error.message : "Data checklist tidak dapat dimuat dari server.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    const handleExport = async (record: PengendalianMutuRecord) => {
        setExportingId(record.id);
        setErrorMessage("");
        try {
            const { exportPengendalianMutuToExcel } = await import("./exportToExcel");
            await exportPengendalianMutuToExcel(record);
        } catch (error) {
            console.error("Gagal mengekspor checklist pengendalian mutu:", error);
            setErrorMessage(error instanceof Error ? error.message : "Excel checklist tidak dapat dibuat.");
        } finally {
            setExportingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus data checklist ini?")) {
            return;
        }
        setDeletingId(id);
        try {
            await deletePengendalianMutuRecord(id);
            setRecords((prev) => prev.filter((r) => r.id !== id));
        } catch (error) {
            console.error("Gagal menghapus data:", error);
            alert(error instanceof Error ? error.message : "Gagal menghapus data dari server.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <PengendalianMutuShell>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-bold text-[#005baa]">Riwayat pengujian</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Daftar Pengendalian Mutu</h1>
                    <p className="mt-2 text-sm text-slate-600">Daftar checklist pengendalian mutu pengujian mikrobiologi.</p>
                </div>
                <Link href="/pengujian/pengendalian-mutu/form" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#005baa] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004b8d]">
                    <ClipboardCheck className="h-4 w-4" />
                    Isi Checklist
                </Link>
            </div>

            {errorMessage && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{errorMessage}</div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                {isLoading ? (
                    <div className="py-16 text-center text-sm text-slate-500">Memuat daftar checklist dari server...</div>
                ) : records.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#005baa]">
                            <FileText className="h-7 w-7" />
                        </div>
                        <h2 className="mt-4 font-bold text-slate-900">Belum ada data checklist</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Checklist yang sudah diisi akan tersimpan di database dan tampil di halaman ini.</p>
                        <Link href="/pengujian/pengendalian-mutu/form" className="mt-5 inline-flex rounded-lg bg-[#005baa] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004b8d]">Mulai Isi Form</Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Tanggal Pengujian</th>
                                    <th className="px-5 py-4">Jenis Sampel</th>
                                    <th className="px-5 py-4">Parameter</th>
                                    <th className="px-5 py-4">Metode</th>
                                    <th className="px-5 py-4">Status Akhir</th>
                                    <th className="px-5 py-4">Penguji</th>
                                    <th className="px-5 py-4">Penyelia</th>
                                    <th className="px-5 py-4">Checklist Terisi</th>
                                    <th className="px-5 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.map((record) => (
                                    <tr key={record.id} className="align-top transition-colors hover:bg-slate-50/70">
                                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                                            {record.tanggalPengujian ? new Date(`${record.tanggalPengujian}T00:00:00`).toLocaleDateString("id-ID") : "-"}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {Array.isArray(record.jenisSampel) ? record.jenisSampel.join(", ") : "-"}
                                        </td>
                                        <td className="px-5 py-4 font-semibold text-slate-800">{record.parameterPengujian}</td>
                                        <td className="px-5 py-4 text-slate-600">{record.metodePengujian === "molekuler" ? "Molekuler (RTi-PCR)" : "Kultur / Konvensional"}</td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${record.statusAkhir === "valid" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                {record.statusAkhir === "valid" ? "Valid" : "Invalid / Re-test"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">{record.pengujiNama || "-"}</td>
                                        <td className="px-5 py-4 text-slate-600">{record.penyelia || "-"}</td>
                                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{checklistCount(record)} tahapan</td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleExport(record)}
                                                    disabled={exportingId !== null || !record.pengujiSignaturePath}
                                                    title={record.pengujiSignaturePath ? "Unduh checklist dalam format Excel" : "Data tidak memiliki tanda tangan untuk diekspor"}
                                                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Download className="h-3.5 w-3.5" />
                                                    {exportingId === record.id ? "Membuat..." : "Excel"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(record.id)}
                                                    disabled={deletingId === record.id}
                                                    title="Hapus data checklist"
                                                    className="inline-flex items-center p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </PengendalianMutuShell>
    );
}
