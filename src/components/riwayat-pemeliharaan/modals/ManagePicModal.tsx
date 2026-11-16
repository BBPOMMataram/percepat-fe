"use client";

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import type { AssetMetadata, MaintenanceOfficer } from "../types";

interface ManagePicModalProps {
  isOpen: boolean;
  initialTab: "assets" | "officers";
  onClose: () => void;
  availableAssets: AssetMetadata[];
  activeAssetToken: string;
  officers: MaintenanceOfficer[];
  authEmployees: any[];
  loadingEmployees: boolean;
  onSelectActiveAsset: (qrToken: string) => void;
  onCreateAsset: (payload: {
    asset_code: string;
    name: string;
    category: string;
    description?: string;
  }) => Promise<boolean>;
  onUpdateAsset: (
    id: number,
    payload: {
      asset_code: string;
      name: string;
      category: string;
      description?: string;
    }
  ) => Promise<boolean>;
  onDeleteAsset: (id: number, name: string) => Promise<void>;
  onAddOfficer: (payload: {
    maintenance_asset_id: number;
    name: string;
    email: string;
    auth_user_id: string | number | null;
    nip: string;
  }) => Promise<boolean>;
  onDeleteOfficer: (id: number, name: string) => void;
}

export default function ManagePicModal({
  isOpen,
  initialTab,
  onClose,
  availableAssets,
  activeAssetToken,
  officers,
  authEmployees,
  loadingEmployees,
  onSelectActiveAsset,
  onCreateAsset,
  onUpdateAsset,
  onDeleteAsset,
  onAddOfficer,
  onDeleteOfficer,
}: ManagePicModalProps) {
  const [activeTab, setActiveTab] = useState<"assets" | "officers">(initialTab);

  // Sync tab saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setActiveTab(availableAssets.length === 0 ? "assets" : initialTab);
    }
  }, [isOpen, initialTab, availableAssets.length]);

  // State Form Tambah / Edit Aset
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [assetCode, setAssetCode] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [savingAsset, setSavingAsset] = useState(false);

  // State Form Tambah Petugas
  const [selectedAssetIdForOfficer, setSelectedAssetIdForOfficer] = useState<number>(
    availableAssets[0]?.id || 0
  );
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [savingOfficer, setSavingOfficer] = useState(false);

  useEffect(() => {
    if (availableAssets.length > 0 && !selectedAssetIdForOfficer) {
      setSelectedAssetIdForOfficer(availableAssets[0].id);
    }
  }, [availableAssets, selectedAssetIdForOfficer]);

  // Filter daftar pegawai: hanya tampilkan nama, sembunyikan yang sudah terdaftar di aset terpilih
  const filteredAuthEmployees = useMemo(() => {
    const existingNames = new Set(
      officers
        .filter(
          (o) =>
            !selectedAssetIdForOfficer ||
            !o.maintenance_asset_id ||
            o.maintenance_asset_id === selectedAssetIdForOfficer
        )
        .map((o) => (o.name || "").toLowerCase().trim())
    );

    return authEmployees.filter((emp) => {
      const empName = (emp.name || "").toLowerCase().trim();
      if (existingNames.has(empName)) return false;

      if (!searchEmployeeQuery.trim()) return true;
      const q = searchEmployeeQuery.toLowerCase().trim();
      return empName.includes(q);
    });
  }, [authEmployees, officers, searchEmployeeQuery, selectedAssetIdForOfficer]);

  if (!isOpen) return null;

  const resetAssetForm = () => {
    setEditingAssetId(null);
    setAssetCode("");
    setAssetName("");
    setAssetCategory("");
    setAssetDescription("");
  };

  const handleStartEditAsset = (asset: AssetMetadata) => {
    setEditingAssetId(asset.id);
    setAssetCode(asset.asset_code);
    setAssetName(asset.name);
    setAssetCategory(asset.category);
    setAssetDescription(asset.description || "");
  };

  const handleSubmitAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetCode.trim() || !assetName.trim() || !assetCategory.trim()) return;

    setSavingAsset(true);
    try {
      let ok = false;
      if (editingAssetId) {
        ok = await onUpdateAsset(editingAssetId, {
          asset_code: assetCode.trim(),
          name: assetName.trim(),
          category: assetCategory.trim(),
          description: assetDescription.trim() || undefined,
        });
      } else {
        ok = await onCreateAsset({
          asset_code: assetCode.trim(),
          name: assetName.trim(),
          category: assetCategory.trim(),
          description: assetDescription.trim() || undefined,
        });
      }
      if (ok) {
        resetAssetForm();
      }
    } finally {
      setSavingAsset(false);
    }
  };

  const handleSubmitOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetIdForOfficer) return;

    const targetName = selectedEmployee
      ? selectedEmployee.name
      : searchEmployeeQuery.trim();
    if (!targetName) return;

    setSavingOfficer(true);
    try {
      const ok = await onAddOfficer({
        maintenance_asset_id: selectedAssetIdForOfficer,
        name: targetName,
        email: selectedEmployee?.email || "",
        auth_user_id: selectedEmployee?.id || null,
        nip: selectedEmployee?.employee?.nip || selectedEmployee?.nik || "-",
      });
      if (ok) {
        setSelectedEmployee(null);
        setSearchEmployeeQuery("");
        setIsEmployeeDropdownOpen(false);
      }
    } finally {
      setSavingOfficer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 no-print print:hidden">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              <Icon icon="solar:settings-minimalistic-bold" width={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Panel PIC: Kelola Aset & Petugas Pemeliharaan
              </h3>
              <p className="text-[11px] text-slate-500">
                Pengaturan master aset fisik BMN dan kewenangan petugas pelaksana
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon icon="solar:close-circle-bold" width={20} />
          </button>
        </div>

        {/* Navigasi 2 Tab: Kelola Aset vs Kelola Petugas */}
        <div className="shrink-0 flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === "assets"
                ? "border-[#005baa] bg-white text-[#005baa] shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon icon="solar:box-minimalistic-bold" width={15} />
            <span>Kelola Aset BMN ({availableAssets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("officers")}
            className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === "officers"
                ? "border-indigo-600 bg-white text-indigo-700 shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon icon="solar:users-group-rounded-bold" width={15} />
            <span>Kelola Petugas ({officers.length})</span>
          </button>
        </div>

        {/* Isi Konten Tab */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
          {activeTab === "assets" ? (
            <>
              {/* TAB 1: FORM TAMBAH / EDIT ASET BMN */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#005baa] font-bold text-xs">
                    <Icon
                      icon={
                        editingAssetId
                          ? "solar:pen-new-square-bold"
                          : "solar:add-circle-bold"
                      }
                      width={16}
                    />
                    <span>
                      {editingAssetId
                        ? "Edit Data Aset Pemeliharaan"
                        : "Tambah Aset Pemeliharaan Baru"}
                    </span>
                  </div>
                  {editingAssetId && (
                    <button
                      type="button"
                      onClick={resetAssetForm}
                      className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 underline"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitAsset} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Kode BMN / Kode Unit <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: BMN-GEN-01"
                        value={assetCode}
                        onChange={(e) => setAssetCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Lokasi / Kategori Aset <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Genset Ruang Belakang"
                        value={assetCategory}
                        onChange={(e) => setAssetCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Barang / Aset Pemeliharaan{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: GENSET — WILSON 100 KVA"
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Deskripsi / Spesifikasi Singkat (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Contoh: Unit cadangan catu daya listrik utama gedung laboratorium dan kantor BBPOM di Mataram."
                      value={assetDescription}
                      onChange={(e) => setAssetDescription(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingAsset}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#004885] active:scale-95 transition disabled:opacity-50"
                    >
                      <Icon icon="solar:check-circle-bold" width={15} />
                      <span>
                        {savingAsset
                          ? "Menyimpan..."
                          : editingAssetId
                          ? "Simpan Perubahan Aset"
                          : "Simpan & Tambahkan Aset"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* DAFTAR ASET TERDAFTAR DI DATABASE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Icon
                      icon="solar:box-minimalistic-bold"
                      width={15}
                      className="text-[#005baa]"
                    />
                    <span>Daftar Aset Pemeliharaan di Database</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    {availableAssets.length} Aset Terdaftar
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="divide-y divide-slate-100">
                    {availableAssets.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        Belum ada aset pemeliharaan di database. Silakan isi form di
                        atas untuk menambahkan aset pertama.
                      </div>
                    ) : (
                      availableAssets.map((asset, idx) => {
                        const isCurrent = asset.qr_token === activeAssetToken;
                        return (
                          <div
                            key={asset.id}
                            className={`p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                              isCurrent ? "bg-blue-50/50" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 font-bold text-[#005baa] text-xs shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {asset.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-200">
                                      Sedang Ditampilkan
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 flex-wrap font-mono">
                                  <span>Kode: {asset.asset_code}</span>
                                  <span>&bull;</span>
                                  <span>{asset.category}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => onSelectActiveAsset(asset.qr_token)}
                                  className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#005baa] hover:bg-blue-100 transition"
                                >
                                  Buka Aset
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartEditAsset(asset)}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteAsset(asset.id, asset.name)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* TAB 2: KELOLA PETUGAS BERWENANG */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Icon icon="solar:user-plus-bold" width={16} />
                  <span>Tambah Petugas Baru ke Aset</span>
                </div>

                {availableAssets.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-xs flex items-center justify-between gap-2">
                    <span>
                      ⚠️ Belum ada aset di database. Tambahkan aset terlebih dahulu
                      sebelum menugaskan petugas.
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("assets")}
                      className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-700"
                    >
                      + Tambah Aset
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitOfficer} className="space-y-3">
                    {/* Pilihan Aset Fisik */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Pilih Aset Fisik BMN <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedAssetIdForOfficer}
                        onChange={(e) =>
                          setSelectedAssetIdForOfficer(Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-medium focus:border-indigo-600 focus:outline-none"
                      >
                        {availableAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            [{asset.asset_code}] {asset.name} ({asset.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cari Pegawai dari SSO Auth BPOM */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700">
                          Pilih Pegawai dari Akun SSO BPOM{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        {authEmployees.length > 0 && (
                          <span className="text-[10px] text-slate-400">
                            {searchEmployeeQuery.trim()
                              ? `${filteredAuthEmployees.length} pegawai ditemukan`
                              : `Total: ${authEmployees.length} pegawai`}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                            <Icon icon="solar:magnifer-linear" width={15} />
                          </span>
                          <input
                            type="text"
                            placeholder="Ketik nama pegawai untuk mencari..."
                            value={searchEmployeeQuery}
                            onFocus={() => setIsEmployeeDropdownOpen(true)}
                            onChange={(e) => {
                              setSearchEmployeeQuery(e.target.value);
                              setIsEmployeeDropdownOpen(true);
                            }}
                            className="w-full rounded-xl border border-indigo-200 bg-white pl-9 pr-8 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none transition shadow-2xs"
                          />
                          {searchEmployeeQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchEmployeeQuery("");
                                setSelectedEmployee(null);
                                setIsEmployeeDropdownOpen(false);
                              }}
                              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                              title="Hapus pencarian"
                            >
                              <Icon icon="solar:close-circle-bold" width={15} />
                            </button>
                          )}
                        </div>

                        {/* Dropdown Hasil Pencarian Langsung Muncul Saat Diketik */}
                        {isEmployeeDropdownOpen &&
                          searchEmployeeQuery.trim().length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                              {filteredAuthEmployees.length === 0 ? (
                                <div className="p-3 text-center text-slate-400 text-xs">
                                  {loadingEmployees
                                    ? "Memuat data pegawai..."
                                    : "Tidak ada pegawai yang cocok atau nama sudah terdaftar sebagai petugas."}
                                </div>
                              ) : (
                                filteredAuthEmployees.map((emp) => (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedEmployee(emp);
                                      setSearchEmployeeQuery(emp.name);
                                      setIsEmployeeDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/80 transition flex items-center justify-between text-xs group"
                                  >
                                    <span className="font-semibold text-slate-800 group-hover:text-indigo-900">
                                      {emp.name}
                                    </span>
                                    <span className="text-[10px] text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition">
                                      + Pilih
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                      </div>

                      {selectedEmployee && (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-2.5 flex items-center justify-between text-xs text-indigo-950 mt-2">
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="solar:check-circle-bold"
                              width={16}
                              className="text-emerald-600 shrink-0"
                            />
                            <div>
                              <span className="font-bold block leading-tight">
                                {selectedEmployee.name}
                              </span>
                              <span className="text-[10px] text-indigo-700 block">
                                Siap ditugaskan ke aset ini
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployee(null);
                              setSearchEmployeeQuery("");
                            }}
                            className="text-[10px] text-slate-400 hover:text-rose-600 underline font-medium"
                          >
                            Batal
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={savingOfficer}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
                      >
                        <Icon icon="solar:check-circle-bold" width={15} />
                        <span>
                          {savingOfficer
                            ? "Menyimpan..."
                            : "Beri Hak Akses Petugas"}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Daftar Petugas yang Memiliki Hak Akses Saat Ini */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Icon
                      icon="solar:shield-check-bold"
                      width={15}
                      className="text-emerald-600"
                    />
                    <span>Daftar Petugas yang Memiliki Hak Akses Saat Ini</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    {officers.length} Petugas Terdaftar
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="divide-y divide-slate-100">
                    {officers.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        Belum ada petugas yang didaftarkan untuk aset ini.
                      </div>
                    ) : (
                      officers.map((officer, idx) => (
                        <div
                          key={officer.id}
                          className="p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-700 text-xs shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-xs block truncate">
                                {officer.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 flex-wrap">
                                <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                  {officer.asset?.name || "Aset BMN"}
                                </span>
                                <span>&bull;</span>
                                <span>Ditunjuk oleh: {officer.added_by_name}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeleteOfficer(officer.id, officer.name)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition shrink-0"
                            title="Cabut kewenangan teknisi ini"
                          >
                            <Icon icon="solar:trash-bin-trash-bold" width={13} />
                            <span>Cabut Akses</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Modal */}
        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 p-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

