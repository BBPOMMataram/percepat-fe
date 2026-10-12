import { Icon } from "@iconify/react";
import Link from "next/link";

type RhpkTab = {
  id: string;
  title: string;
};

type RhpkPageProps = {
  params: Promise<{ year: string }>;
};

export default async function RhpkPage({ params }: RhpkPageProps) {
  const { year } = await params;

  const tabs: RhpkTab[] = [];

  const spreadsheetName = "Google Sheets";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Header halaman */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="text-slate-400">SIPROVAL</span>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="h-4 w-4 text-slate-300"
                />
                <span className="font-semibold text-[#005baa]">
                  RHPK {year}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Rekap RHPK {year}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Pilih tab untuk melihat data monitoring dan evaluasi RHPK.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-[#eef6fc] px-4 py-2.5">
              <Icon
                icon="solar:file-text-bold"
                className="h-4 w-4 text-[#005baa]"
              />
              <span className="text-sm font-semibold text-[#005baa]">
                {tabs.length} Tab
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Ringkasan */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            label="Tahun"
            value={year}
            icon="solar:calendar-bold"
            iconClass="bg-blue-50 text-[#005baa]"
          />

          <SummaryCard
            label="Total Tab"
            value={String(tabs.length)}
            icon="solar:documents-bold"
            iconClass="bg-emerald-50 text-[#00a651]"
          />

          <SummaryCard
            label="Sumber Data"
            value="Google Sheets"
            subtitle={`RHPK ${year}`}
            icon="solar:database-bold"
            iconClass="bg-violet-50 text-violet-600"
          />
        </div>

        {/* Daftar tab */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">Daftar Tab RHPK</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pilih tab yang ingin kamu lihat untuk membuka rekap monitoring.
          </p>
        </div>

        {tabs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tabs.map((tab, index) => (
              <Link
                key={tab.id}
                href={`/siproval/rhpk/${year}/${encodeURIComponent(tab.id)}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc] text-[#005baa] transition group-hover:bg-blue-100">
                      <Icon icon="solar:table-bold" className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Tab {index + 1}
                      </span>

                      <h3 className="line-clamp-2 text-base font-bold leading-6 text-slate-900 group-hover:text-[#005baa]">
                        {tab.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        Sheet ID: {tab.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-[#005baa]">
                    <Icon icon="solar:arrow-right-linear" className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Aktif
                  </span>

                  <span className="text-xs font-semibold text-[#005baa] opacity-0 transition group-hover:opacity-100">
                    Lihat rekap
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Icon
                icon="solar:documents-bold"
                className="h-7 w-7 text-slate-400"
              />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              Belum ada tab RHPK
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Belum terdapat tab Google Sheets yang aktif untuk RHPK {year}.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>RHPK {year}</span>
          <span>
            Sumber:{" "}
            <span className="font-medium text-slate-500">
              {spreadsheetName}
            </span>
          </span>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon icon={icon} className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
