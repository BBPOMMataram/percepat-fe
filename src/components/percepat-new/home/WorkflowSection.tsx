"use client";

import React from "react";
import Link from "next/link";

export default function WorkflowSection() {
    const steps = [
        {
            number: "01",
            title: "Pilih & Ajukan Kebutuhan",
            desc: "Temukan barang di katalog inventaris yang tersedia, lalu ajukan formulir permintaan dengan menentukan jumlah dan tujuan pengujian/kantor.",
            icon: "post_add",
            badge: "Langkah Pertama",
        },
        {
            number: "02",
            title: "Verifikasi Berjenjang",
            desc: "Permintaan diteruskan ke Ketua Tim (Katim) dan Admin untuk diperiksa ketersediaan stok serta disetujui secara digital dengan tanda tangan resmi.",
            icon: "verified_user",
            badge: "Validasi Digital",
        },
        {
            number: "03",
            title: "Serah Terima & Label QR",
            desc: "Barang diserahkan kepada pemohon dengan tanggal penyerahan resmi dan ditempeli stiker label QR untuk kemudahan pelacakan laboratorium.",
            icon: "qr_code_2",
            badge: "Pengambilan Barang",
        },
    ];

    return (
        <section id="alur" className="py-14 sm:py-18 bg-slate-50/70 border-b border-slate-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-700/15 mb-3">
                        <span>Alur Layanan Sederhana</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                        Bagaimana PERCEPAT Bekerja?
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mt-2">
                        Proses permohonan persediaan dirancang ringkas, tertib administrasi, dan terdokumentasi rapi dari pengajuan hingga barang diterima.
                    </p>
                </div>

                {/* 3 Step Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    {steps.map((step, idx) => (
                        <div
                            key={step.number}
                            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-lg ring-1 ring-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-2xl">
                                            {step.icon}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                                        STEP {step.number}
                                    </span>
                                </div>

                                <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">
                                    {step.badge}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                                    {step.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-medium text-slate-600">
                                <span>{idx === 0 ? "Buka formulir permintaan" : idx === 1 ? "Notifikasi ke Katim" : "Cetak stiker identitas"}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA Banner */}
                <div className="mt-10 p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">help_outline</span>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">Perlu mengajukan bahan pengujian sekarang?</div>
                            <div className="text-xs text-slate-600">Pastikan stok tersedia pada tabel di bawah sebelum mengisi formulir.</div>
                        </div>
                    </div>
                    <Link
                        href="/percepat-new/permintaan/form"
                        className="btn btn-sm bg-blue-700 hover:bg-blue-800 border-none text-white font-semibold px-4 rounded-xl shrink-0"
                    >
                        Mulai Formulir Permintaan
                    </Link>
                </div>
            </div>
        </section>
    );
}
