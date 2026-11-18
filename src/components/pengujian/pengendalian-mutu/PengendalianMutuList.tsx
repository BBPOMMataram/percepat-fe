"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ClipboardCheck, Download, FileText } from "lucide-react";
import PengendalianMutuShell from "./PengendalianMutuShell";
import { readPengendalianMutuRecords, type PengendalianMutuRecord } from "./data";
import { exportPengendalianMutuToExcel } from "./exportToExcel";

function checklistCount(record: PengendalianMutuRecord): number {
    return Object.values(record.checklist).filter((answer) => Boolean(answer.status)).length;
}

export default function PengendalianMutuList() {
    const [records, setRecords] = useState<PengendalianMutuRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [exportingId, setExportingId] = useState<string | null>(null);

    useEffect(() => {
        try {
            setRecords(readPengendalianMutuRecords());
        } catch (error) {
            console.error("Gagal membaca data checklist pengendalian mutu:", error);
            setErrorMessage(error instanceof Error ? error.message : "Data checklist lokal tidak dapat dibaca.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleExport = async (record: PengendalianMutuRecord) => {
        setExportingId(record.id);
        setErrorMessage("");
        try {
            await exportPengendalianMutuToExcel(record);
        } catch (error) {
            console.error("Gagal mengekspor checklist pengendalian mutu:", error);
            setErrorMessage(error instanceof Error ? error.message : "Excel checklist tidak dapat dibuat.");
        } finally {
            setExportingId(null);
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

            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#005baa]" />
                <p>Data saat ini disimpan sementara di browser ini. Integrasi dengan backend akan dilakukan pada tahap berikutnya.</p>
            </div>

            {errorMessage && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{errorMessage}</div>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                {isLoading ? (
                    <div className="py-16 text-center text-sm text-slate-500">Memuat daftar checklist...</div>
                ) : records.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#005baa]">
                            <FileText className="h-7 w-7" />
                        </div>
                        <h2 className="mt-4 font-bold text-slate-900">Belum ada data checklist</h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Checklist yang sudah diisi akan tampil di halaman ini.</p>
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
                                    <th className="px-5 py-4">Ekspor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.map((record) => (
                                    <tr key={record.id} className="align-top transition-colors hover:bg-slate-50/70">
                                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">{new Date(`${record.tanggalPengujian}T00:00:00`).toLocaleDateString("id-ID")}</td>
                                        <td className="px-5 py-4 text-slate-600">{record.jenisSampel.join(", ")}</td>
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
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleExport(record)}
                                                disabled={exportingId !== null || !record.pengujiSignaturePath}
                                                title={record.pengujiSignaturePath ? "Unduh checklist dalam format Excel" : "Data lama tidak memiliki tanda tangan untuk diekspor"}
                                                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Download className="h-4 w-4" />
                                                {exportingId === record.id ? "Membuat..." : "Excel"}
                                            </button>
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
