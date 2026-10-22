"use client";

import React from "react";

export type CategoryKey = "reagen" | "bakuPembanding" | "atk" | "sukuCadang" | "perlengkapan" | "reagenExpiring" | "bakuPembandingExpiring";

interface CategoryCardsProps {
    activeCategory: CategoryKey;
    onSelectCategory: (cat: CategoryKey) => void;
}

const CATEGORIES = [
    {
        key: "reagen" as CategoryKey,
        title: "Reagen",
        badge: "Laboratorium",
        badgeColor: "bg-blue-50 text-blue-700 ring-blue-600/20",
        desc: "Pelarut organik, bahan kimia analisis, reagen pengujian, dan media kultur mikrobiologi.",
        icon: "biotech",
        iconBg: "bg-blue-50 text-blue-700 ring-blue-600/15",
    },
    {
        key: "bakuPembanding" as CategoryKey,
        title: "Baku Pembanding",
        badge: "Standar Mutu",
        badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        desc: "Baku pembanding primer/sekunder, senyawa referensi bersertifikat, dan penanda baku mutu.",
        icon: "scale",
        iconBg: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    },
    {
        key: "atk" as CategoryKey,
        title: "Alat Tulis Kantor",
        badge: "Operasional",
        badgeColor: "bg-amber-50 text-amber-700 ring-amber-600/20",
        desc: "Kertas, pulpen, formulir pengujian, binder berkas, dan perlengkapan administrasi kantor.",
        icon: "edit_note",
        iconBg: "bg-amber-50 text-amber-700 ring-amber-600/15",
    },
    {
        key: "sukuCadang" as CategoryKey,
        title: "Suku Cadang",
        badge: "Instrumen Lab",
        badgeColor: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        desc: "Komponen pengganti instrumen analisis, filter, seal, selang, dan aksesoris peralatan laboratorium.",
        icon: "settings_input_component",
        iconBg: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
    },
    {
        key: "perlengkapan" as CategoryKey,
        title: "Perlengkapan Kebersihan",
        badge: "Sanitasi & APD",
        badgeColor: "bg-teal-50 text-teal-700 ring-teal-600/20",
        desc: "Cairan pembersih kaca, sabun laboratorium, sarung tangan, tisu bebas serat, dan alat sanitasi.",
        icon: "cleaning_services",
        iconBg: "bg-teal-50 text-teal-700 ring-teal-600/15",
    },
];

export default function CategoryCards({ activeCategory, onSelectCategory }: CategoryCardsProps) {
    const handleCardClick = (catKey: CategoryKey) => {
        onSelectCategory(catKey);
        const element = document.getElementById("inventory");
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section id="kategori" className="py-12 sm:py-16 bg-white border-b border-slate-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 mb-2">
                            <span>Eksplorasi Katalog</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                            Kategori Persediaan
                        </h2>
                        <p className="text-sm text-slate-600 mt-1 max-w-xl">
                            Pilih kategori untuk memfilter data inventaris langsung pada tabel di bawah.
                        </p>
                    </div>

                    <div className="text-xs text-slate-600 hidden md:block">
                        Klik kartu untuk membuka katalog
                    </div>
                </div>

                {/* 5 Category Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => handleCardClick(cat.key)}
                                className={`group text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                                    isActive
                                        ? "bg-blue-50/70 border-blue-400/90 shadow-sm ring-1 ring-blue-500/20 translate-y-[-2px]"
                                        : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:shadow-xs hover:translate-y-[-1px]"
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div
                                            className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center transition-transform group-hover:scale-105 ${cat.iconBg}`}
                                        >
                                            <span className="material-symbols-outlined text-xl">
                                                {cat.icon}
                                            </span>
                                        </div>
                                        <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${cat.badgeColor}`}
                                        >
                                            {cat.badge}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                                        {cat.title}
                                    </h3>
                                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                                        {cat.desc}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                                    <span className={isActive ? "text-blue-700" : "text-slate-600 group-hover:text-slate-900"}>
                                        {isActive ? "Sedang Dibuka" : "Lihat Stok"}
                                    </span>
                                    <span
                                        className={`material-symbols-outlined text-base transition-transform group-hover:translate-x-1 ${
                                            isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-700"
                                        }`}
                                    >
                                        arrow_forward
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
