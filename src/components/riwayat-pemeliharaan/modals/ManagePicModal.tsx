"use client";

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import type {
  AssetMetadata,
  MaintenanceOfficer,
  MasterBarangItem,
} from "../types";

interface ManagePicModalProps {
  isOpen: boolean;
  initialTab: "assets" | "officers";
  onClose: () => void;
  availableAssets: AssetMetadata[];
  activeAssetToken: string;
  masterBarangs: MasterBarangItem[];
  loadingMasterBarangs: boolean;
  officers: MaintenanceOfficer[];
  authEmployees: any[];
  loadingEmployees: boolean;
  onSelectActiveAsset: (qrToken: string) => void;
  onCreateAssetFromMaster: (barang: MasterBarangItem) => Promise<boolean>;
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
  masterBarangs,
  loadingMasterBarangs,
  officers,
  authEmployees,
  loadingEmployees,
  onSelectActiveAsset,
  onCreateAssetFromMaster,
  onDeleteAsset,
  onAddOfficer,
  onDeleteOfficer,
}: ManagePicModalProps) {
  const [activeTab, setActiveTab] = useState<"assets" | "officers">(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(availableAssets.length === 0 ? "assets" : initialTab);
    }
  }, [isOpen, initialTab, availableAssets.length]);

  // State Pilih Master Barang (Tab 1: Kelola Aset BMN)
  const [searchBarangQuery, setSearchBarangQuery] = useState("");
  const [selectedMasterBarang, setSelectedMasterBarang] =
    useState<MasterBarangItem | null>(null);
  const [isBarangDropdownOpen, setIsBarangDropdownOpen] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);

  // State Form Tambah Petugas (Tab 2: Kelola Petugas)
  const [selectedAssetIdForOfficer, setSelectedAssetIdForOfficer] =
    useState<number>(availableAssets[0]?.id || 0);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [savingOfficer, setSavingOfficer] = useState(false);

  useEffect(() => {
    if (availableAssets.length > 0 && !selectedAssetIdForOfficer) {
      setSelectedAssetIdForOfficer(availableAssets[0].id);
    }
  }, [availableAssets, selectedAssetIdForOfficer]);

  // Filter Master Barang: sembunyikan barang yang sudah ditambahkan ke daftar aset pemeliharaan
  const filteredMasterBarangs = useMemo(() => {
    const existingBarangIds = new Set(
      availableAssets
        .map((a) => a.barang_id)
        .filter((id): id is number => typeof id === "number" && id > 0)
    );
    const existingCodes = new Set(
      availableAssets.map((a) => (a.asset_code || "").toLowerCase().trim())
    );

    return masterBarangs.filter((item) => {
      if (existingBarangIds.has(item.id)) return false;
      if (existingCodes.has((item.asset_code || "").toLowerCase().trim())) {
        return false;
      }

      if (!searchBarangQuery.trim()) return true;
      const q = searchBarangQuery.toLowerCase().trim();
      return (
        (item.display_name || "").toLowerCase().includes(q) ||
        (item.nama || "").toLowerCase().includes(q) ||
        (item.kode || "").toLowerCase().includes(q) ||
        (item.merk || "").toLowerCase().includes(q) ||
        (item.tipe || "").toLowerCase().includes(q) ||
        (item.lokasi || "").toLowerCase().includes(q) ||
        (item.asset_code || "").toLowerCase().includes(q)
      );
    });
  }, [masterBarangs, availableAssets, searchBarangQuery]);

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

  const handleSubmitMasterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterBarang) return;

    setSavingAsset(true);
    try {
      const ok = await onCreateAssetFromMaster(selectedMasterBarang);
      if (ok) {
        setSelectedMasterBarang(null);
        setSearchBarangQuery("");
        setIsBarangDropdownOpen(false);
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
              <Icon icon="solar:settings-Minimalistic-bold" width={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Panel PIC SIMPEL BMN: Kelola Aset & Petugas
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih aset dari Master Barang BMN dan atur petugas pelaksana pemeliharaan
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

        {/* Navigasi Tab: 1. Kelola Aset BMN | 2. Kelola Petugas */}
        <div className="shrink-0 flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`inline-flex items-center gap-1.5 rounded-t-xl px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === "assets"
                ? "border-[#005baa] bg-white text-[#005baa] shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon icon="solar:box-minimalistic-bold" width={15} />
            <span>1. Kelola Aset BMN ({availableAssets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("officers")}
            className={`inline-flex items-center gap-1.5 rounded-t-xl px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === "officers"
                ? "border-indigo-600 bg-white text-indigo-700 shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon icon="solar:users-group-rounded-bold" width={15} />
            <span>2. Kelola Petugas ({officers.length})</span>
          </button>
        </div>

        {/* Isi Modal Berdasarkan Tab */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
          {activeTab === "assets" ? (
            <>
              {/* TAB 1: PILIH DARI MASTER BARANG SIMPEL BMN (TANPA INPUT MANUAL) */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#005baa] font-bold text-xs">
                    <Icon icon="solar:add-circle-bold" width={16} />
                    <span>Tambah Aset dari Master Barang SIMPEL BMN</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {loadingMasterBarangs
                      ? "Memuat data master..."
                      : `${filteredMasterBarangs.length} barang tersedia`}
                  </span>
                </div>

                <form onSubmit={handleSubmitMasterAsset} className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Cari & Pilih Aset dari Master Barang <span className="text-rose-500">*</span>
                    </label>

                    <div className="relative">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                          <Icon icon="solar:magnifer-linear" width={15} />
                        </span>
                        <input
                          type="text"
                          placeholder="Ketik nama barang, merk, tipe, lokasi, atau kode BMN..."
                          value={searchBarangQuery}
                          onFocus={() => setIsBarangDropdownOpen(true)}
                          onChange={(e) => {
                            setSearchBarangQuery(e.target.value);
                            setSelectedMasterBarang(null);
                            setIsBarangDropdownOpen(true);
                          }}
                          className="w-full rounded-xl border border-blue-200 bg-white pl-9 pr-16 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none transition shadow-2xs"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                          {searchBarangQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchBarangQuery("");
                                setSelectedMasterBarang(null);
                                setIsBarangDropdownOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600"
                              title="Bersihkan pencarian"
                            >
                              <Icon icon="solar:close-circle-bold" width={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setIsBarangDropdownOpen((prev) => !prev)
                            }
                            className="p-1 text-slate-500 hover:text-[#005baa]"
                            title="Buka/Tutup Daftar Barang"
                          >
                            <Icon
                              icon={
                                isBarangDropdownOpen
                                  ? "solar:alt-arrow-up-bold"
                                  : "solar:alt-arrow-down-bold"
                              }
                              width={14}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Daftar Master Barang */}
                      {isBarangDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                          {loadingMasterBarangs ? (
                            <div className="p-4 text-center text-slate-400 text-xs">
                              Memuat daftar master barang dari database SIMPEL BMN...
                            </div>
                          ) : filteredMasterBarangs.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs">
                              Tidak ada barang yang cocok atau barang sudah ditambahkan ke daftar aset.
                            </div>
                          ) : (
                            filteredMasterBarangs.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMasterBarang(item);
                                  setSearchBarangQuery(
                                    `[${item.asset_code}] ${item.display_name}`
                                  );
                                  setIsBarangDropdownOpen(false);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/80 transition flex items-center justify-between gap-2 text-xs group"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 group-hover:text-[#005baa] truncate">
                                    {item.display_name}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                                    <span className="font-mono font-semibold text-[#005baa] bg-blue-50 px-1.5 py-0.2 rounded">
                                      {item.asset_code}
                                    </span>
                                    {item.lokasi && item.lokasi !== "-" && (
                                      <>
                                        <span>&bull;</span>
                                        <span>Lokasi: {item.lokasi}</span>
                                      </>
                                    )}
                                    {item.kondisi && (
                                      <>
                                        <span>&bull;</span>
                                        <span>Kondisi: {item.kondisi}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <span className="text-[10px] text-[#005baa] font-bold opacity-0 group-hover:opacity-100 shrink-0 transition">
                                  + Pilih
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preview Barang Master yang Terpilih */}
                    {selectedMasterBarang && (
                      <div className="rounded-xl border border-blue-200 bg-white p-3 flex items-center justify-between gap-3 text-xs mt-2.5 shadow-2xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <Icon
                            icon="solar:check-circle-bold"
                            width={18}
                            className="text-emerald-600 shrink-0 mt-0.5"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">
                              {selectedMasterBarang.display_name}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-semibold text-[#005baa]">
                                Kode: {selectedMasterBarang.asset_code}
                              </span>
                              <span>&bull;</span>
                              <span>
                                Lokasi/Kategori: {selectedMasterBarang.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMasterBarang(null);
                            setSearchBarangQuery("");
                          }}
                          className="text-[10px] text-slate-400 hover:text-rose-600 underline font-semibold shrink-0"
                        >
                          Batal Pilih
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingAsset || !selectedMasterBarang}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#004885] active:scale-95 transition disabled:opacity-50"
                    >
                      <Icon icon="solar:check-circle-bold" width={15} />
                      <span>
                        {savingAsset
                          ? "Menyimpan..."
                          : "Tambahkan ke Aset Pemeliharaan"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Aset Pemeliharaan yang Terdaftar di Database */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Icon
                      icon="solar:layers-minimalistic-bold"
                      width={15}
                      className="text-[#005baa]"
                    />
                    <span>Daftar Aset Pemeliharaan Terdaftar</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    {availableAssets.length} Aset
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="divide-y divide-slate-100">
                    {availableAssets.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        Belum ada aset pemeliharaan di database. Silakan cari dan pilih aset dari Master Barang di atas.
                      </div>
                    ) : (
                      availableAssets.map((asset) => {
                        const isCurrent = asset.qr_token === activeAssetToken;
                        return (
                          <div
                            key={asset.id}
                            className={`p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                              isCurrent ? "bg-blue-50/50" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#005baa] border border-slate-200">
                                  {asset.asset_code}
                                </span>
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {asset.name}
                                </span>
                                {isCurrent && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                    Sedang Ditampilkan
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Lokasi/Kategori: <strong>{asset.category}</strong>
                                {asset.description ? ` • ${asset.description}` : ""}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
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
                                onClick={() => onDeleteAsset(asset.id, asset.name)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition inline-flex items-center gap-1"
                              >
                                <Icon icon="solar:trash-bin-trash-bold" width={12} />
                                <span>Hapus</span>
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
              {/* TAB 2: FORM TAMBAH & DAFTAR PETUGAS PEMELIHARAAN */}
              {availableAssets.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center space-y-2">
                  <Icon
                    icon="solar:Minimalistic-magnifer-bug-bold"
                    width={28}
                    className="mx-auto text-amber-600"
                  />
                  <h4 className="font-bold text-amber-950 text-xs">
                    Belum Ada Aset Pemeliharaan
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Silakan tambahkan aset terlebih dahulu pada tab{" "}
                    <strong>1. Kelola Aset BMN</strong> sebelum menunjuk petugas pemeliharaan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("assets")}
                    className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[#005baa] px-3.5 py-1.5 text-xs font-bold text-white"
                  >
                    <span>Ke Tab Kelola Aset BMN &rarr;</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <Icon icon="solar:user-plus-bold" width={16} />
                      <span>Tambah Petugas Baru ke Aset</span>
                    </div>

                    <form onSubmit={handleSubmitOfficer} className="space-y-3">
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
                                setSelectedEmployee(null);
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

                          {/* Dropdown Hasil Pencarian Langsung Muncul Saat Diketik (Hanya Nama, Tanpa NIP) */}
                          {isEmployeeDropdownOpen &&
                            searchEmployeeQuery.trim().length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                                {loadingEmployees ? (
                                  <div className="p-3 text-center text-slate-400 text-xs">
                                    Memuat data pegawai dari SSO Auth BPOM...
                                  </div>
                                ) : filteredAuthEmployees.length === 0 ? (
                                  <div className="p-3 text-center text-slate-400 text-xs">
                                    Tidak ada pegawai yang cocok atau nama sudah terdaftar sebagai petugas.
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
                  </div>

                  {/* Daftar Petugas Aktif */}
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
                                onClick={() =>
                                  onDeleteOfficer(officer.id, officer.name)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition shrink-0"
                                title="Cabut kewenangan teknisi ini"
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-bold"
                                  width={13}
                                />
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
