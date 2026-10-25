"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

type YearItem = {
  id: number;
  year_number: number;
  desc?: string;
  spreadsheet_count?: number;
};

export default function ShowMonev() {
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState<YearItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchYears() {
      setLoading(true);
      try {
        const res = await api.get(`${baseUrl}/api/test-local-table/years`);
        if (res.data?.data && Array.isArray(res.data.data)) {
          setYears(res.data.data);
        } else if (Array.isArray(res.data?.years)) {
          setYears(res.data.years);
        } else if (Array.isArray(res.data)) {
          setYears(res.data);
        }
      } catch (err) {
        console.error("Gagal mengambil data tahun RHPK:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchYears();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Bersih & Minimal Tanpa Ikon Berlebihan */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <span>Kepala Balai</span>
              <span>/</span>
              <span className="text-slate-800">Tambah Arahan Pimpinan</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tambah Arahan Pimpinan
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Pilih tahun anggaran RHPK yang aktif untuk memberikan arahan pimpinan dan meninjau capaian kinerja bulanan.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-bold text-[#005baa]">
            Tahun Berjalan: {currentYear}
          </div>
        </div>
      </div>

      {/* Daftar Tahun Riil yang Memiliki Data RHPK */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/60">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Daftar Tahun Anggaran RHPK
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menampilkan data riil tahun yang telah didaftarkan pada SIPROVAL.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
              <p className="mt-2 text-xs text-slate-500">Memuat daftar tahun RHPK...</p>
            </div>
          ) : years.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Belum ada data tahun RHPK yang terdaftar di database.
            </div>
          ) : (
            years.map((item) => (
              <div
                key={item.id || item.year_number}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4.5 transition hover:bg-slate-50/70"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-[#005baa]">
                      Tahun {item.year_number}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Aktif
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-slate-900">
                    {item.desc || `Rekap Data RHPK ${item.year_number} Mataram`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Data RHPK lokal mandiri (tanpa API) &bull; Siap dievaluasi dan ditambahkan arahan pimpinan.
                  </p>
                </div>

                <Link
                  href={`/siproval/rhpk/${item.year_number}`}
                  className="inline-flex items-center justify-center rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#004887] self-start sm:self-center"
                >
                  Buka & Tambah Arahan &rarr;
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
