import { Icon } from "@iconify/react";
import Link from "next/link";

export default function ShowMonevPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header halaman */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef6fc]">
            <Icon
              icon="solar:clipboard-list-bold"
              className="h-6 w-6 text-[#005baa]"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">Data RHPK</h1>
            <p className="text-sm text-gray-500">
              Rekapitulasi Rencana Hasil Pelaksanaan Kegiatan
            </p>
          </div>
        </div>
      </div>

      {/* Card daftar tahun */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Card header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef6fc]">
              <Icon
                icon="solar:calendar-bold"
                className="h-5 w-5 text-[#005baa]"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Data RHPK Per Tahun
              </h2>
              <p className="text-sm text-gray-500">
                Pilih tahun RHPK yang ingin dilihat.
              </p>
            </div>
          </div>
        </div>

        {/* Daftar tahun */}
        <div className="divide-y divide-gray-100">
          {/* Tahun 2027 */}
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <span className="text-sm font-semibold text-gray-400">27</span>
              </div>

              <div>
                <p className="font-semibold text-gray-700">Tahun 2027</p>
                <p className="mt-1 text-sm text-gray-400">
                  Data belum tersedia
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400">
              Coming Soon
            </span>
          </div>

          {/* Tahun 2026 */}
          <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef6fc]">
                <span className="text-sm font-bold text-[#005baa]">26</span>
              </div>

              <div>
                <p className="font-semibold text-gray-800">Tahun 2026</p>
                <p className="mt-1 text-sm text-gray-500">
                  Rekap Data RHPK 2026 Mataram
                </p>
              </div>
            </div>

            <Link
              href="/siproval/arahan-pimpinan/tabs?year=2026"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#005baa] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#004b8d]"
            >
              Lihat RHPK
              <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
