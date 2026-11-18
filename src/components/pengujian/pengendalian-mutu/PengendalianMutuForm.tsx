"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import Image from "next/image";
import { useSelector } from "react-redux";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { RootState } from "@/redux/store";
import PengendalianMutuShell from "./PengendalianMutuShell";
import {
    CHECKLIST_SECTIONS,
    getSignatureUrl,
    SAMPLE_TYPES,
    SUPERVISORS,
    savePengendalianMutuRecord,
    type ChecklistAnswer,
    type ChecklistStatus,
    type PengendalianMutuRecord,
} from "./data";

const STATUS_OPTIONS: { value: ChecklistStatus; label: string }[] = [
    { value: "ya", label: "Ya" },
    { value: "tidak", label: "Tidak" },
    { value: "na", label: "N/A" },
];

export default function PengendalianMutuForm() {
    const router = useRouter();
    const { loading } = useRequireAuth();
    const user = useSelector((state: RootState) => state.auth.user);
    const [tanggalPengujian, setTanggalPengujian] = useState("");
    const [jenisSampel, setJenisSampel] = useState<string[]>([]);
    const [parameterPengujian, setParameterPengujian] = useState("");
    const [metodePengujian, setMetodePengujian] = useState<"molekuler" | "kultur" | "">("");
    const [statusAkhir, setStatusAkhir] = useState<"valid" | "invalid" | "">("");
    const [penyelia, setPenyelia] = useState<(typeof SUPERVISORS)[number] | "">("");
    const [checklist, setChecklist] = useState<Record<string, ChecklistAnswer>>({});
    const [catatanEvaluasi, setCatatanEvaluasi] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const updateChecklist = (key: string, value: Partial<ChecklistAnswer>) => {
        setChecklist((current) => ({
            ...current,
            [key]: { ...current[key], ...value },
        }));
    };

    const handleSampleChange = (sampleType: string, checked: boolean) => {
        setJenisSampel((current) => checked
            ? [...current, sampleType]
            : current.filter((value) => value !== sampleType));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage("");

        if (jenisSampel.length === 0) {
            setErrorMessage("Pilih setidaknya satu jenis sampel.");
            return;
        }
        if (!tanggalPengujian || !parameterPengujian.trim() || !metodePengujian || !statusAkhir || !penyelia) {
            setErrorMessage("Lengkapi semua informasi pengujian yang wajib diisi.");
            return;
        }
        if (!user?.signature_path) {
            setErrorMessage("Tanda tangan belum tersedia pada akun Anda. Lengkapi tanda tangan melalui halaman profil sebelum mengisi checklist.");
            return;
        }

        const completedChecklist: Record<string, ChecklistAnswer> = {};
        CHECKLIST_SECTIONS.forEach((section) => {
            section.items.forEach((item) => {
                completedChecklist[item.key] = {
                    ...checklist[item.key],
                    note: checklist[item.key]?.note ?? item.note ?? "",
                };
            });
        });

        const record: PengendalianMutuRecord = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            createdAt: new Date().toISOString(),
            tanggalPengujian,
            jenisSampel,
            parameterPengujian: parameterPengujian.trim(),
            metodePengujian,
            statusAkhir,
            checklist: completedChecklist,
            catatanEvaluasi: catatanEvaluasi.trim(),
            penyelia,
            pengujiNama: user.name,
            pengujiSignaturePath: user.signature_path,
        };

        try {
            savePengendalianMutuRecord(record);
            router.push("/pengujian/pengendalian-mutu");
        } catch (error) {
            console.error("Gagal menyimpan checklist pengendalian mutu:", error);
            setErrorMessage("Data belum dapat disimpan di browser ini. Periksa ruang penyimpanan browser, lalu coba lagi.");
        }
    };

    if (loading || !user) {
        return (
            <PengendalianMutuShell>
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                    Memuat akun pengguna...
                </div>
            </PengendalianMutuShell>
        );
    }

    const signatureUrl = user.signature_path ? getSignatureUrl(user.signature_path) : null;

    return (
        <PengendalianMutuShell>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-bold text-[#005baa]">Formulir baru</p>
                    <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Lembar Checklist Pengendalian Mutu</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Isi informasi pengujian dan evaluasi setiap tahapan sesuai lembar checklist pengendalian mutu.</p>
                </div>
                <Link href="/pengujian/pengendalian-mutu" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke daftar
                </Link>
            </div>

            {errorMessage && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>{errorMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                    <div className="mb-5 border-b border-slate-100 pb-4">
                        <h2 className="font-bold text-slate-900">Informasi Pengujian</h2>
                        <p className="mt-1 text-sm text-slate-500">Informasi dasar sampel dan metode pengujian.</p>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <label className="block text-sm font-semibold text-slate-700">
                            Tanggal Pengujian <span className="text-rose-600">*</span>
                            <input type="date" value={tanggalPengujian} onChange={(event) => setTanggalPengujian(event.target.value)} required className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-[#005baa] focus:ring-2 focus:ring-blue-100" />
                        </label>
                        <fieldset>
                            <legend className="text-sm font-semibold text-slate-700">Jenis Sampel <span className="text-rose-600">*</span></legend>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                                {SAMPLE_TYPES.map((sampleType) => (
                                    <label key={sampleType} className="inline-flex items-center gap-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={jenisSampel.includes(sampleType)} onChange={(event) => handleSampleChange(sampleType, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-[#005baa] focus:ring-[#005baa]" />
                                        {sampleType}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <label className="block text-sm font-semibold text-slate-700">
                            Parameter Pengujian <span className="text-rose-600">*</span>
                            <input type="text" value={parameterPengujian} onChange={(event) => setParameterPengujian(event.target.value)} maxLength={255} required placeholder="Contoh: Angka Lempeng Total" className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-[#005baa] focus:ring-2 focus:ring-blue-100" />
                        </label>
                        <fieldset>
                            <legend className="text-sm font-semibold text-slate-700">Metode Pengujian <span className="text-rose-600">*</span></legend>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="metode" value="molekuler" checked={metodePengujian === "molekuler"} onChange={() => setMetodePengujian("molekuler")} required className="h-4 w-4 border-slate-300 text-[#005baa] focus:ring-[#005baa]" /> Molekuler (RTi-PCR)</label>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="metode" value="kultur" checked={metodePengujian === "kultur"} onChange={() => setMetodePengujian("kultur")} required className="h-4 w-4 border-slate-300 text-[#005baa] focus:ring-[#005baa]" /> Kultur / Konvensional</label>
                            </div>
                        </fieldset>
                        <fieldset className="md:col-span-2">
                            <legend className="text-sm font-semibold text-slate-700">Status Akhir <span className="text-rose-600">*</span></legend>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="status" value="valid" checked={statusAkhir === "valid"} onChange={() => setStatusAkhir("valid")} required className="h-4 w-4 border-slate-300 text-emerald-700 focus:ring-emerald-600" /> Valid</label>
                                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="radio" name="status" value="invalid" checked={statusAkhir === "invalid"} onChange={() => setStatusAkhir("invalid")} required className="h-4 w-4 border-slate-300 text-rose-700 focus:ring-rose-600" /> Invalid / Re-test</label>
                            </div>
                        </fieldset>
                        <label className="block text-sm font-semibold text-slate-700">
                            Penyelia <span className="text-rose-600">*</span>
                            <select value={penyelia} onChange={(event) => {
                                const selected = SUPERVISORS.find((name) => name === event.target.value);
                                setPenyelia(selected ?? "");
                            }} required className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-[#005baa] focus:ring-2 focus:ring-blue-100">
                                <option value="">Pilih penyelia</option>
                                {SUPERVISORS.map((name) => <option key={name} value={name}>{name}</option>)}
                            </select>
                        </label>
                    </div>
                </section>

                {!signatureUrl ? (
                    <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                        <p>Tanda tangan digital belum tersedia pada akun {user.name}. Lengkapi tanda tangan melalui halaman profil sebelum menyimpan checklist.</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Paraf penguji dari akun login</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{user.name}</p>
                        </div>
                        <Image src={signatureUrl} alt={`Tanda tangan ${user.name}`} width={160} height={72} unoptimized className="h-16 w-36 rounded border border-blue-100 bg-white object-contain p-1" />
                    </div>
                )}

                {CHECKLIST_SECTIONS.map((section) => (
                    <section key={section.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                            <h2 className="font-bold text-slate-900">{section.title}</h2>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {section.items.map((item) => (
                                <article key={item.key} className="p-5 sm:p-6">
                                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                                            <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.criteria}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <fieldset>
                                                <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">Kriteria Kesesuaian</legend>
                                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                                                    {STATUS_OPTIONS.map((option) => (
                                                        <label key={option.value} className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                            <input type="radio" name={`checklist-${item.key}`} value={option.value} checked={checklist[item.key]?.status === option.value} onChange={() => updateChecklist(item.key, { status: option.value })} className="h-4 w-4 border-slate-300 text-[#005baa] focus:ring-[#005baa]" />
                                                            {option.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </fieldset>
                                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                                                <label className="block text-xs font-semibold text-slate-600">
                                                    Catatan / tindakan ketidaksesuaian
                                                    <input type="text" value={checklist[item.key]?.note ?? item.note ?? ""} onChange={(event) => updateChecklist(item.key, { note: event.target.value })} maxLength={1000} className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none transition focus:border-[#005baa] focus:ring-2 focus:ring-blue-100" />
                                                </label>
                                                <div className="block text-xs font-semibold text-slate-600">
                                                    <span>Paraf penguji</span>
                                                    {signatureUrl ? <Image src={signatureUrl} alt={`Paraf ${user.name}`} width={112} height={48} unoptimized className="mt-1.5 h-10 w-28 rounded border border-slate-200 bg-white object-contain p-1" /> : <p className="mt-2 font-normal text-rose-600">TTD tidak tersedia</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                ))}

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
                    <h2 className="font-bold text-slate-900">Verifikasi & Tanda Tangan</h2>
                    <label className="mt-4 block text-sm font-semibold text-slate-700">
                        Catatan Evaluasi / Rekomendasi
                        <textarea value={catatanEvaluasi} onChange={(event) => setCatatanEvaluasi(event.target.value)} rows={4} maxLength={5000} className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-[#005baa] focus:ring-2 focus:ring-blue-100" />
                    </label>
                    <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                        <p className="text-sm text-slate-600">Diverifikasi oleh Penyelia,</p>
                        <p className="mt-14 border-t border-slate-300 pt-2 text-sm font-bold text-slate-800">{penyelia || "Pilih penyelia di bagian informasi pengujian"}</p>
                    </div>
                </section>

                <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                    <Link href="/pengujian/pengendalian-mutu" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</Link>
                    <button type="submit" disabled={!signatureUrl} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#005baa] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004b8d] disabled:cursor-not-allowed disabled:opacity-50">
                        <Save className="h-4 w-4" />
                        Simpan Checklist
                    </button>
                </div>
            </form>
        </PengendalianMutuShell>
    );
}
