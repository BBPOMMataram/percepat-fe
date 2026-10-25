"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import api from "@/utils/api";

const baseUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000"
).replace(/\/+$/, "");

type MonthLockItem = {
  month: number;
  name: string;
  is_past: boolean;
  is_current: boolean;
  is_future: boolean;
  is_unlocked: boolean;
  is_unlocked_individually: boolean;
  note: string | null;
  unlocked_by: string | null;
  updated_at: string | null;
};

export default function SyncPermission() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Month Locks state
  const [monthLocks, setMonthLocks] = useState<MonthLockItem[]>([]);
  const [universalUnlocked, setUniversalUnlocked] = useState(false);
  const [selectedYear] = useState<number>(2026);
  const [loadingMonthLocks, setLoadingMonthLocks] = useState(false);
  const [togglingMonth, setTogglingMonth] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMonthLocks(selectedYear);
    }
  }, [user?.id, selectedYear]);

  const fetchMonthLocks = async (year = selectedYear) => {
    setLoadingMonthLocks(true);
    try {
      const query = user?.id ? `&user_id=${user.id}` : "";
      const res = await api.get(`${baseUrl}/api/superadmin/month-lock?year=${year}${query}`);
      const data = res.data?.data || res.data;
      if (data?.months) {
        setMonthLocks(data.months);
      }
      setUniversalUnlocked(Boolean(data?.universal_unlocked));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Gagal memuat status kunci bulan.");
    } finally {
      setLoadingMonthLocks(false);
    }
  };

  const handleToggleMonthLock = async (month: number, currentUnlocked: boolean) => {
    setTogglingMonth(month);
    setErrorMsg("");
    setSuccessMsg("");
    const newUnlocked = !currentUnlocked;

    try {
      const query = user?.id ? `?user_id=${user.id}` : "";
      const res = await api.post(`${baseUrl}/api/superadmin/month-lock${query}`, {
        month,
        year: selectedYear,
        is_unlocked: newUnlocked,
        note: newUnlocked
          ? month === 0
            ? "Seluruh bulan dibuka oleh Superadmin"
            : `Bulan dibuka oleh Superadmin`
          : "Dikunci kembali oleh Superadmin",
      });

      setSuccessMsg(res.data?.message || "Status kunci bulan berhasil diperbarui.");
      fetchMonthLocks(selectedYear);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMsg(e.response?.data?.message || "Gagal memperbarui status kunci bulan.");
    } finally {
      setTogglingMonth(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Otorisasi & Kunci Bulan
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Pengaturan pembukaan dan penguncian periode bulan pengisian data untuk Ketua Tim.
        </p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-700 hover:text-red-900">
            &times;
          </button>
        </div>
      )}

      {/* Konten Otorisasi Kunci Bulan */}
      <div className="space-y-6">
        {/* Universal Unlock Card */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-bold text-slate-900">
                  Otorisasi Universal Bulan Lampau
                </h2>
                {universalUnlocked && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800 font-bold">
                    Status: Buka Universal
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Secara default sistem, seluruh baris data pada bulan sebelum bulan berjalan terkunci (read-only). 
                Gunakan tombol di samping untuk <strong>membuka seluruh bulan lampau sekaligus</strong> untuk semua Ketua Tim.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={togglingMonth === 0}
                onClick={() => handleToggleMonthLock(0, universalUnlocked)}
                className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-xs ${
                  universalUnlocked
                    ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-[#005baa] text-white hover:bg-[#004b8d]"
                } disabled:opacity-50`}
              >
                <span>
                  {togglingMonth === 0
                    ? "Memproses..."
                    : universalUnlocked
                      ? "Kunci Semua Bulan Lampau"
                      : "Buka Semua Bulan Lampau (Universal)"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Month Cards Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Status Pengisian Per Bulan (Tahun {selectedYear})
              </h2>
              <p className="text-xs text-slate-500">
                Buka atau kunci izin pengisian data Katim untuk bulan-bulan tertentu.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchMonthLocks(selectedYear)}
                disabled={loadingMonthLocks}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Icon icon="solar:refresh-linear" width={14} className={loadingMonthLocks ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loadingMonthLocks ? (
            <div className="p-12 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#005baa] border-r-transparent" />
              <p className="mt-2 text-xs text-slate-500">Memuat status penguncian bulan...</p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {monthLocks.map((m) => {
                const isCurrent = m.is_current;
                const isFuture = m.is_future;
                const isPast = m.is_past;

                return (
                  <div
                    key={m.month}
                    className={`relative flex flex-col justify-between rounded-xl border p-4 transition ${
                      isCurrent
                        ? m.is_unlocked
                          ? "border-emerald-300 bg-emerald-50/30"
                          : "border-red-300 bg-red-50/20"
                        : m.is_unlocked && isPast
                          ? "border-sky-300 bg-sky-50/30"
                          : isPast
                            ? "border-slate-200 bg-slate-50/50"
                            : !m.is_unlocked
                              ? "border-red-200 bg-red-50/20"
                              : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {String(m.month).padStart(2, "0")}
                        </span>
                        {isCurrent ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              m.is_unlocked
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                m.is_unlocked ? "bg-emerald-600" : "bg-red-600"
                              }`}
                            />
                            {m.is_unlocked ? "Bulan Ini (Terbuka)" : "Bulan Ini (Dikunci Admin)"}
                          </span>
                        ) : isFuture ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              m.is_unlocked
                                ? "bg-slate-100 text-slate-600"
                                : "bg-red-100 text-red-800 font-bold"
                            }`}
                          >
                            {m.is_unlocked ? "Mendatang" : "Terkunci Admin"}
                          </span>
                        ) : m.is_unlocked ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                            Dibuka Superadmin
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            Terkunci
                          </span>
                        )}
                      </div>

                      <h3 className="mt-2 text-sm font-bold text-slate-800">
                        {m.name}
                      </h3>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {isCurrent
                          ? m.is_unlocked
                            ? "Bulan berjalan (dapat diisi Katim)"
                            : "Bulan berjalan dikunci oleh Admin (hanya baca untuk Katim)"
                          : isFuture
                            ? m.is_unlocked
                              ? "Bulan mendatang (dapat diisi)"
                              : "Bulan mendatang dikunci oleh Admin"
                            : m.is_unlocked
                              ? universalUnlocked
                                ? "Terbuka melalui status Universal"
                                : "Terbuka khusus untuk bulan ini"
                              : "Terkunci (hanya baca untuk Katim)"}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={togglingMonth === m.month || (isPast && universalUnlocked)}
                        onClick={() => handleToggleMonthLock(m.month, m.is_unlocked)}
                        className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs font-bold transition ${
                          m.is_unlocked
                            ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            : "border border-[#005baa] bg-white text-[#005baa] hover:bg-blue-50"
                        } disabled:opacity-50`}
                      >
                        <Icon
                          icon={
                            togglingMonth === m.month
                              ? "solar:refresh-circle-linear"
                              : m.is_unlocked
                                ? "solar:lock-bold"
                                : "solar:lock-unlocked-bold"
                          }
                          width={14}
                          className={togglingMonth === m.month ? "animate-spin" : ""}
                        />
                        <span>
                          {togglingMonth === m.month
                            ? "Menyimpan..."
                            : m.is_unlocked
                              ? isCurrent
                                ? "Kunci Bulan Ini"
                                : isPast
                                  ? "Kunci Kembali"
                                  : "Kunci Bulan Ini"
                              : isCurrent
                                ? "Buka Bulan Ini"
                                : isPast
                                  ? "Buka Akses"
                                  : "Buka Bulan Ini"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
