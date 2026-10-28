"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Icon } from "@iconify/react";
import api from "@/utils/api";

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8006";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  nip: string;
  jabatan: string;
  pangkat: string;
  unit_kerja: string;
  fungsi: string;
  role_label: string;
  is_katim: boolean;
  is_current_user: boolean;
  assigned_tabs: string[];
}

interface SpreadsheetInfo {
  id: number;
  google_spreadsheet_id?: string;
  name: string;
  tabs: string[];
}

interface IkskTeam {
  id: number;
  name: string;
  spreadsheets: SpreadsheetInfo[];
  members_count: number;
  members: TeamMember[];
}

interface UserIkskOption {
  id: number;
  name: string;
}

export default function AnggotaTimKatim() {
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userIksks, setUserIksks] = useState<UserIkskOption[]>([]);
  const [ikskList, setIkskList] = useState<IkskTeam[]>([]);
  const [selectedIkskId, setSelectedIkskId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchTeamData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const queryParams = new URLSearchParams();
      if (user?.id) queryParams.set("user_id", String(user.id));
      if (selectedIkskId && selectedIkskId !== "ALL") {
        queryParams.set("iksk_id", selectedIkskId);
      }

      const res = await api.get(
        `${baseUrl}/api/katim/anggota-tim?${queryParams.toString()}`
      );

      if (res.data?.status === "success" && res.data?.data) {
        if (res.data.data.user_iksks) {
          setUserIksks(res.data.data.user_iksks);
        }
        setIkskList(res.data.data.iksks || []);
      }
    } catch (err: any) {
      console.error("Gagal memuat daftar anggota tim:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Gagal memuat daftar anggota tim dari server Siproval."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTeamData();
    }
  }, [user?.id, selectedIkskId]);

  // Total statistics across fetched IKSKs
  const totalIksks = userIksks.length;
  const allUniqueMembers = useMemo(() => {
    const map = new Map<string, TeamMember>();
    ikskList.forEach((iksk) => {
      iksk.members.forEach((m) => {
        if (!map.has(m.id)) {
          map.set(m.id, m);
        }
      });
    });
    return Array.from(map.values());
  }, [ikskList]);

  // Filtered by search query
  const filteredIkskList = useMemo(() => {
    if (!searchQuery.trim()) return ikskList;
    const q = searchQuery.toLowerCase().trim();

    return ikskList
      .map((iksk) => {
        const matchesIkskName = iksk.name.toLowerCase().includes(q);
        const filteredMembers = iksk.members.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.nip.toLowerCase().includes(q) ||
            m.jabatan.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.fungsi.toLowerCase().includes(q) ||
            m.assigned_tabs.some((t) => t.toLowerCase().includes(q))
        );

        if (matchesIkskName) return iksk;
        if (filteredMembers.length > 0) {
          return {
            ...iksk,
            members: filteredMembers,
          };
        }
        return null;
      })
      .filter((iksk): iksk is IkskTeam => iksk !== null);
  }, [ikskList, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              <Icon icon="solar:users-group-two-rounded-bold" width={14} />
              Struktur Tim Kerja IKSK
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#005baa]">
              <Icon icon="solar:user-bold" width={14} />
              {user?.name || "Ketua Tim"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Daftar Anggota & Personil Tim IKSK
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Informasi seluruh personil, Ketua Tim (Katim), serta PIC indikator yang bertugas dan bertanggung jawab pada IKSK Anda di BBPOM di Mataram.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/siproval/katim/entry-data-rhpk"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#005baa] shadow-sm transition hover:bg-blue-50"
          >
            <Icon icon="solar:document-text-bold" width={16} />
            <span>Form Realisasi Capaian</span>
          </Link>
          <Link
            href="/siproval/katim/arahan-pimpinan"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Icon icon="solar:chat-round-line-bold" width={16} />
            <span>Arahan Pimpinan</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              IKSK Ditugaskan
            </span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#005baa]">
              <Icon icon="solar:layers-bold" width={22} />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{totalIksks}</div>
          <p className="mt-1 text-xs text-slate-500">
            Indikator Kinerja yang dipimpin atau diampu
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Rekan / Personil
            </span>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <Icon icon="solar:users-group-rounded-bold" width={22} />
            </div>
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{allUniqueMembers.length}</div>
          <p className="mt-1 text-xs text-slate-500">
            Total personil / PIC terhubung dalam tim kerja Anda
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status Anda
            </span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Icon icon="solar:shield-check-bold" width={22} />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 truncate">
            {user?.name || "Ketua Tim"}
          </div>
          <p className="mt-1 text-xs text-emerald-700 font-medium">
            Ketua Tim (Katim) Aktif
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-600">Filter IKSK:</span>
          <select
            value={selectedIkskId}
            onChange={(e) => setSelectedIkskId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-[#005baa] focus:bg-white focus:ring-2 focus:ring-[#005baa]/20 max-w-md truncate"
          >
            <option value="ALL">Semua IKSK ({userIksks.length} IKSK Terhubung)</option>
            {userIksks.map((iksk) => (
              <option key={iksk.id} value={iksk.id}>
                IKSK {iksk.id}: {iksk.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Icon
            icon="solar:magnifer-linear"
            width={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIP, jabatan, tab..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#005baa] focus:bg-white focus:ring-2 focus:ring-[#005baa]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icon icon="solar:close-circle-bold" width={14} />
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-3">
          <Icon icon="solar:danger-triangle-bold" width={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#005baa]/20 border-t-[#005baa]" />
          <p className="mt-4 text-sm font-semibold text-slate-700">Memuat Data Anggota Tim...</p>
          <p className="mt-1 text-xs text-slate-400">
            Mengambil daftar personil dan hak pengisian indikator
          </p>
        </div>
      ) : filteredIkskList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
            <Icon icon="solar:users-group-two-rounded-bold" width={40} />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">
            Tidak Ada Anggota Tim Ditemukan
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            {searchQuery
              ? `Tidak ada data personil atau IKSK yang cocok dengan kata kunci "${searchQuery}".`
              : "Belum ada personil atau IKSK yang terdaftar pada akun Anda."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        /* Team List grouped by IKSK */
        <div className="space-y-6">
          {filteredIkskList.map((iksk) => (
            <div
              key={iksk.id}
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* IKSK Header */}
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#005baa] px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                        <Icon icon="solar:tag-bold" width={12} />
                        IKSK #{iksk.id}
                      </span>
                      <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#005baa]">
                        {iksk.members.length} Personil Terdaftar
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {iksk.name}
                    </h2>
                  </div>

                  <Link
                    href={`/siproval/katim/entry-data-rhpk?iksk_id=${iksk.id}`}
                    className="inline-flex items-center gap-1.5 self-start lg:self-center rounded-xl border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#005baa] hover:bg-blue-50 transition"
                  >
                    <Icon icon="solar:document-text-bold" width={14} />
                    <span>Buka Tabel RHPK IKSK</span>
                    <Icon icon="solar:arrow-right-up-linear" width={12} />
                  </Link>
                </div>

                {/* Linked Spreadsheets & Tabs Info */}
                {iksk.spreadsheets && iksk.spreadsheets.length > 0 && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Icon icon="solar:layers-minimalistic-bold" width={13} className="text-slate-400" />
                      Tab Terhubung:
                    </span>
                    {iksk.spreadsheets.map((sp) =>
                      sp.tabs.map((t, idx) => (
                        <span
                          key={`${sp.id}-${idx}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs"
                          title={`Spreadsheet: ${sp.name}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Members Cards Grid */}
              <div className="p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {iksk.members.map((member) => (
                    <div
                      key={member.id}
                      className={`relative flex flex-col justify-between rounded-xl border p-4.5 transition-all ${
                        member.is_current_user
                          ? "border-[#005baa]/30 bg-blue-50/20 shadow-xs ring-1 ring-[#005baa]/20"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        {/* Member Top Bar: Avatar & Badges */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold shadow-xs ${
                                member.is_current_user
                                  ? "bg-[#005baa] text-white"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                  {member.name}
                                </h3>
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {member.nip && member.nip !== "-" ? `NIP. ${member.nip}` : "NIP: -"}
                              </p>
                            </div>
                          </div>

                          {member.is_current_user && (
                            <span className="shrink-0 rounded-md bg-[#005baa] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                              Anda
                            </span>
                          )}
                        </div>

                        {/* Role & Position Details */}
                        <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Peran:</span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                member.is_katim
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              }`}
                            >
                              {member.role_label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Jabatan:</span>
                            <span className="font-medium text-slate-700 text-right truncate max-w-[170px]" title={member.jabatan}>
                              {member.jabatan}
                            </span>
                          </div>

                          {member.pangkat && member.pangkat !== "-" && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 text-[11px]">Pangkat/Gol:</span>
                              <span className="font-medium text-slate-700 text-right">
                                {member.pangkat}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Fungsi:</span>
                            <span className="font-medium text-slate-700 text-right truncate max-w-[170px]">
                              {member.fungsi}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Email:</span>
                            <a
                              href={`mailto:${member.email}`}
                              className="font-medium text-[#005baa] hover:underline truncate max-w-[170px]"
                              title={member.email}
                            >
                              {member.email}
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Assigned Tabs in this IKSK */}
                      <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                          <Icon icon="solar:document-linear" width={11} />
                          Tanggung Jawab Pengisian Tab:
                        </p>
                        {member.assigned_tabs && member.assigned_tabs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.assigned_tabs.map((tabTitle, tIdx) => (
                              <span
                                key={tIdx}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                              >
                                {tabTitle}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Personil / PIC Tim IKSK
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

