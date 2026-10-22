"use client";

import React from "react";

export default function PengujianFooter() {
    return (
        <footer className="bg-white border-t border-slate-200 py-4 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} Balai Besar Pengawas Obat dan Makanan (BBPOM) di Mataram &bull; Sistem Pengujian Laboratorium Terpadu (Next.js + Laravel + Excel + DomPDF + FPDF)
            </div>
        </footer>
    );
}
