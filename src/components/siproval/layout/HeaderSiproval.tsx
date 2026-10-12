"use client";

import { Icon } from "@iconify/react";

type HeaderSiprovalProps = {
  title: string;
  description?: string;
  userName?: string;
};

export default function HeaderSiproval({
  title,
  description,
  userName,
}: HeaderSiprovalProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm lg:px-8">
      {/* Judul halaman */}
      <div className="min-w-0">
        <h2 className="truncate text-xl font-bold text-slate-800">{title}</h2>

        {description && (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {/* Pengguna dan notifikasi */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-blue-700"
        >
          <Icon icon="solar:bell-bold" width={20} height={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-emerald-500" />
        </button>

        {userName && (
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
              {userName.trim().charAt(0).toUpperCase()}
            </div>

            <span className="max-w-40 truncate text-sm font-semibold text-slate-700">
              {userName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
