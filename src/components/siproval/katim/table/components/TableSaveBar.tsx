"use client";

import React from "react";

export interface TableSaveBarProps {
  /** Jumlah perubahan yang belum disimpan. */
  dirtyCount: number;
  saving: boolean;
  /** Handler yang sama dengan tombol "Simpan Perubahan" di atas (konfirmasi & validasi Kendala/RTL tetap berlaku). */
  onSave: () => void;
}

/**
 * Tombol "Simpan Perubahan" yang diletakkan tepat di bawah tabel, agar pengguna tidak perlu
 * menggulir kembali ke atas setelah selesai mengisi.
 */
export const TableSaveBar: React.FC<TableSaveBarProps> = ({
  dirtyCount,
  saving,
  onSave,
}) => {
  const hasChanges = dirtyCount > 0;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3">
      <span className="text-xs text-slate-600" aria-live="polite">
        {hasChanges ? (
          <>
            <strong className="font-semibold text-slate-900">{dirtyCount}</strong>{" "}
            perubahan belum disimpan
          </>
        ) : (
          "Tidak ada perubahan yang belum disimpan"
        )}
      </span>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !hasChanges}
        className="rounded-lg bg-[#005baa] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#004281] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 cursor-pointer"
      >
        {saving
          ? "Menyimpan..."
          : `Simpan Perubahan${hasChanges ? ` (${dirtyCount})` : ""}`}
      </button>
    </div>
  );
};

export default TableSaveBar;
