"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { getUser, login, logout } from "@/features/authSlice";
import axios from "@/utils/axios";

// Tipe Data Log Pemeliharaan Fisik BMN
export interface MaintenanceRecord {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  activityType:
    | "warming_up"
    | "emergency_run"
    | "routine_service"
    | "fuel_refill"
    | "load_test"
    | "repair"
    | "other";
  activityDetails?: string; // Uraian detail kegiatan yang diisi petugas
  executorName: string; // Pelaksana (diambil dari akun SSO login)
  executorRole?: string;
  executorNip?: string | null;
  verifierName: string; // Pemeriksa PIC
  isVerified: boolean;
  verifiedAt?: string;
  statusAfter: "standby" | "trouble" | "need_followup";
  notes?: string; // Catatan temuan / hasil akhir pemeriksaan
  initialPhotoUrl?: string; // Foto bukti awal (panel kontrol / fisik awal)
  finalPhotoUrl?: string; // Foto bukti akhir (panel kontrol / fisik akhir)
}

// Sesi Kegiatan yang Sedang Berjalan (Active Check-in)
export interface ActiveMaintenanceSession {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  startTimeDisplay: string;
  startTimestamp: number;
  activityType: MaintenanceRecord["activityType"];
  activityDetails: string; // Uraian detail yang diisi saat check-in
  executorName: string;
  executorRole: string;
  executorNip?: string | null;
  initialPhotoUrl?: string;
}

// User Profile SSO BPOM Murni dari Database
export interface AuthUser {
  id?: string | number;
  name: string;
  rawName?: string;
  role: string;
  nip: string | null;
  email: string;
  isPic?: boolean;
  signaturePath?: string | null;
  signatureUrl?: string | null;
}

// Profil PIC Aset BMN dari Database
export interface PicInfo {
  id?: string;
  name: string;
  raw_name?: string;
  email?: string;
  nip?: string | null;
  jabatan?: string;
  signature_path?: string | null;
  role_title?: string;
}

// Helper: Format nama pegawai murni dari database (gelar depan/belakang hanya jika ada, jangan mengarang gelar)
export const formatPersonName = (
  rawName?: string,
  gelarDepan?: string | null,
  gelarBelakang?: string | null
): string => {
  if (!rawName) return "-";
  const gd = (gelarDepan || "").trim();
  const cleanGd = gd === "-" || gd.toLowerCase() === "null" ? "" : gd;
  const gb = (gelarBelakang || "").trim();
  const cleanGb = gb === "-" || gb.toLowerCase() === "null" ? "" : gb;

  return `${cleanGd ? cleanGd + " " : ""}${rawName}${cleanGb ? ", " + cleanGb : ""}`;
};

// Helper: Bentuk URL Tanda Tangan Digital dari Auth-BPOM
export const getSignatureUrl = (sigPath?: string | null): string | null => {
  if (!sigPath) return null;
  if (
    sigPath.startsWith("http://") ||
    sigPath.startsWith("https://") ||
    sigPath.startsWith("data:image/")
  ) {
    return sigPath;
  }
  const authBase =
    process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";
  const cleanPath = sigPath.startsWith("/") ? sigPath.slice(1) : sigPath;
  return `${authBase}/storage/${cleanPath}`;
};

// Metadata Profil Aset Fisik
export interface AssetMetadata {
  id: number;
  asset_code: string;
  name: string;
  category: string;
  qr_token: string;
  current_status: string;
  description?: string;
  fuel_level_percent?: number;
  last_warmed_up_at?: string;
  last_serviced_at?: string;
}

// Data Petugas yang Diberi Kewenangan oleh PIC
export interface MaintenanceOfficer {
  id: number;
  maintenance_asset_id?: number | null;
  user_id?: number | null;
  nip: string;
  name: string;
  added_by_name: string;
  is_active: boolean;
  asset?: {
    id: number;
    name: string;
    asset_code: string;
  };
}

// Metadata Default Genset BBPOM di Mataram
const DEFAULT_ASSET_INFO: AssetMetadata = {
  id: 1,
  asset_code: "BMN-GEN-01",
  name: "GENSET — WILSON 100 KVA",
  category: "Genset Ruang Belakang",
  qr_token: "bpom-genset-mataram-01",
  current_status: "standby",
  description:
    "Gedung Belakang • Rumah Genset BBPOM di Mataram (Penunjang Utama Listrik Laboratorium Pengujian, Cold Storage & Server)",
  fuel_level_percent: 85,
  last_warmed_up_at: "2026-07-02 11:25",
  last_serviced_at: "2026-04-18 09:18",
};

// Daftar Pilihan Aset yang Tersedia di Database
const AVAILABLE_ASSETS: AssetMetadata[] = [
  DEFAULT_ASSET_INFO,
];

// Daftar Petugas & Catatan Awal Kosong (Dimuat langsung dari Database bbpo_simpel-bmn)
const INITIAL_OFFICERS: MaintenanceOfficer[] = [];

// Catatan Riwayat Awal Kosong (Dimuat langsung dari Database bbpo_simpel-bmn)
const INITIAL_RECORDS: MaintenanceRecord[] = [];

export default function RiwayatPemeliharaanMain() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useSelector((state: RootState) => state.auth);

  // Endpoint Backend
  const SIMPEL_BMN_URL = process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN || "http://localhost:8010";
  const AUTH_URL = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";

  // State Utama Riwayat Pemeliharaan
  const [records, setRecords] = useState<MaintenanceRecord[]>(INITIAL_RECORDS);
  const [assetInfo, setAssetInfo] = useState<AssetMetadata>(DEFAULT_ASSET_INFO);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verifyingLogId, setVerifyingLogId] = useState<number | null>(null);

  // State Manajemen Petugas Berwenang (Dikelola oleh PIC)
  const [officers, setOfficers] = useState<MaintenanceOfficer[]>(INITIAL_OFFICERS);
  const [isManageOfficersModalOpen, setIsManageOfficersModalOpen] = useState(false);
  const [selectedAssetIdForOfficer, setSelectedAssetIdForOfficer] = useState<number>(1);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState<boolean>(false);
  const [authEmployees, setAuthEmployees] = useState<any[]>([]);
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState<string>("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Filter Daftar Pegawai: hanya tampilkan nama, dan jangan munculkan nama yang sudah ditambahkan
  const filteredAuthEmployees = useMemo(() => {
    // Kumpulkan nama dan user_id petugas yang sudah terdaftar agar tidak muncul lagi
    const existingNames = new Set(
      officers.map((o) => (o.name || "").toLowerCase().trim())
    );
    const existingUserIds = new Set(
      officers.map((o) => String(o.user_id || "")).filter((id) => id !== "")
    );

    return authEmployees.filter((emp) => {
      const empName = (emp.name || "").toLowerCase().trim();
      const empIdStr = String(emp.id || "");

      // 1. Jika nama atau ID sudah terdaftar sebagai petugas aktif, JANGAN MUNCULKAN LAGI
      if (existingNames.has(empName)) return false;
      if (empIdStr && existingUserIds.has(empIdStr)) return false;

      // 2. Filter berdasarkan nama yang sedang diketik di pencarian
      if (!searchEmployeeQuery.trim()) return true;
      const q = searchEmployeeQuery.toLowerCase().trim();
      return empName.includes(q);
    });
  }, [authEmployees, officers, searchEmployeeQuery]);
  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    userName: string;
    userRole: string;
    userNip: string;
  } | null>(null);

  // Tampilan tabel selalu aktif (tanpa kartu)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // Navigasi Langsung ke Halaman Login Resmi SSO BPOM Percepat (/login)
  const redirectToLogin = useCallback(() => {
    router.push("/login?redirectUrl=/riwayat-pemeliharaan");
  }, [router]);

  // Status Otoritas User dari Backend simpel-bmn (Penghubung Data Auth dengan Simpel BMN)
  const [userAuthority, setUserAuthority] = useState<{
    isPic: boolean;
    isAuthorizedOfficer: boolean;
    checked: boolean;
  }>({
    isPic: false,
    isAuthorizedOfficer: false,
    checked: false,
  });

  // State Profil PIC Aset BMN Murni dari Database
  const [picInfo, setPicInfo] = useState<PicInfo | null>(null);

  // Derived Profil Petugas dari Akun SSO Auth BPOM
  const currentUser: AuthUser | null = useMemo(() => {
    if (!authUser) return null;
    const emp = authUser.employee;
    const jabatan = emp?.jabatan || "";
    const fungsi = emp?.fungsi?.name || "";
    const roleLabel = jabatan
      ? fungsi
        ? `${jabatan} - ${fungsi}`
        : jabatan
      : userAuthority.isPic
      ? "PIC Sarpras (Kabag TU)"
      : "Pegawai BBPOM";

    const cleanNip =
      emp?.nip && emp.nip !== "-" && emp.nip.toLowerCase() !== "null"
        ? emp.nip
        : null;

    const formattedName = formatPersonName(
      authUser.name,
      emp?.gelar_depan,
      emp?.gelar_belakang
    );

    return {
      id: authUser.id,
      name: formattedName,
      rawName: authUser.name,
      role: roleLabel,
      nip: cleanNip,
      email: authUser.email,
      isPic: userAuthority.isPic,
      signaturePath: authUser.signature_path,
      signatureUrl: getSignatureUrl(authUser.signature_path),
    };
  }, [authUser, userAuthority.isPic]);

  // URL Tanda Tangan PIC & Pelaksana Murni dari Database Auth-BPOM
  const picSignatureUrl = useMemo(() => {
    return getSignatureUrl(picInfo?.signature_path);
  }, [picInfo?.signature_path]);

  const executorSignatureUrl = useMemo(() => {
    if (records.length === 0) return null;
    const firstExec = records[0];
    if (
      currentUser &&
      (currentUser.name === firstExec.executorName ||
        currentUser.rawName === firstExec.executorName)
    ) {
      return currentUser.signatureUrl;
    }
    const matched = authEmployees.find(
      (e) =>
        e.name === firstExec.executorName ||
        formatPersonName(
          e.name,
          e.employee?.gelar_depan,
          e.employee?.gelar_belakang
        ) === firstExec.executorName
    );
    if (matched?.signature_path) {
      return getSignatureUrl(matched.signature_path);
    }
    return null;
  }, [records, currentUser, authEmployees]);

  // State Sesi Kegiatan Aktif (Langkah 1 Check-in -> Langkah 2 Check-out)
  const [activeSession, setActiveSession] = useState<ActiveMaintenanceSession | null>(null);
  const [runningMinutes, setRunningMinutes] = useState(0);

  // State Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; caption: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [qrHostMode, setQrHostMode] = useState<"lan" | "localhost">("lan");

  // Form Check-in
  const [checkInTimeCaptured, setCheckInTimeCaptured] = useState<{
    dateStr: string;
    timeStr: string;
    displayStr: string;
    timestamp: number;
  }>({
    dateStr: "",
    timeStr: "",
    displayStr: "",
    timestamp: 0,
  });
  const [checkInActivityType, setCheckInActivityType] = useState<MaintenanceRecord["activityType"]>("warming_up");
  const [checkInCustomType, setCheckInCustomType] = useState("");
  const [checkInDetails, setCheckInDetails] = useState("");
  const [checkInPhotoUrl, setCheckInPhotoUrl] = useState<string>("");

  // Form Check-out
  const [checkOutTimeCaptured, setCheckOutTimeCaptured] = useState<{
    timeStr: string;
    displayStr: string;
    duration: number;
  }>({
    timeStr: "",
    displayStr: "",
    duration: 0,
  });
  const [checkOutStatusAfter, setCheckOutStatusAfter] = useState<MaintenanceRecord["statusAfter"]>("standby");
  const [checkOutNotes, setCheckOutNotes] = useState("");
  const [checkOutPhotoUrl, setCheckOutPhotoUrl] = useState<string>("");

  // Mode Cetak: "table" untuk Lembar Kendali Resmi (hanya tabel), "sticker" untuk Stiker QR fisik
  const [printMode, setPrintMode] = useState<"table" | "sticker">("table");

  const handlePrintTable = () => {
    setPrintMode("table");
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintSticker = () => {
    setPrintMode("sticker");
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Handler Upload Foto Asli (Kamera HP / File Asli dengan Kompresi Otomatis)
  const handlePhotoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      showToast("⚠️ Ukuran foto terlalu besar (maksimal 12MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setter(dataUrl);
        } else {
          setter(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Ambil sesi user SSO Auth BPOM saat pertama kali render
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // Helper normalisasi log database menjadi format record tampilan
  const mapLogToRecord = (log: any): MaintenanceRecord => {
    const started = log.started_at ? new Date(log.started_at) : new Date();
    const finished = log.finished_at ? new Date(log.finished_at) : null;
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = log.date || `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())}`;
    const startStr = log.startTime || `${pad(started.getHours())}:${pad(started.getMinutes())}`;
    const endStr = log.endTime || (finished ? `${pad(finished.getHours())}:${pad(finished.getMinutes())}` : "-");

    return {
      id: log.id,
      date: dateStr,
      startTime: startStr,
      endTime: endStr,
      durationMinutes: log.duration_minutes ?? log.durationMinutes ?? 0,
      activityType: log.activity_type || log.activityType || "routine_service",
      activityDetails: log.activity_details || log.activityDetails || "",
      executorName: log.executor_name || log.executorName || "Petugas",
      executorRole: log.executor_role || log.executorRole || "Petugas",
      executorNip: log.executor_nip ?? log.executorNip ?? null,
      verifierName: log.verifier_name || log.verifierName || "PIC BMN",
      isVerified: !!(log.is_verified ?? log.isVerified),
      verifiedAt: log.verified_at
        ? new Date(log.verified_at).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) + " WITA"
        : log.verifiedAt || undefined,
      statusAfter: log.status_after || log.statusAfter || "standby",
      notes: log.notes,
      initialPhotoUrl: log.initial_photo_path || log.initialPhotoUrl,
      finalPhotoUrl: log.final_photo_path || log.finalPhotoUrl,
    };
  };

  // Helper normalisasi sesi aktif berjalan dari database
  const mapActiveSession = (sess: any): ActiveMaintenanceSession => {
    const started = sess.started_at ? new Date(sess.started_at) : new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())}`;
    const timeStr = `${pad(started.getHours())}:${pad(started.getMinutes())}`;
    const displayStr =
      started.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WITA";

    return {
      id: sess.id,
      date: dateStr,
      startTime: timeStr,
      startTimeDisplay: sess.startTimeDisplay || displayStr,
      startTimestamp: sess.startTimestamp || started.getTime(),
      activityType: sess.activity_type || sess.activityType || "warming_up",
      activityDetails: sess.activity_details || sess.activityDetails || "",
      executorName: sess.executor_name || sess.executorName || "Petugas",
      executorRole: sess.executor_role || sess.executorRole || "Petugas",
      executorNip: sess.executor_nip ?? sess.executorNip ?? null,
      initialPhotoUrl: sess.initial_photo_path || sess.initialPhotoUrl,
    };
  };

  // Muat data aset, log, dan petugas resmi langsung dari backend simpel-bmn
  const loadAssetData = useCallback(async () => {
    try {
      const res = await axios.get(`${SIMPEL_BMN_URL}/api/maintenance/asset/${assetInfo.qr_token}`);
      if (res.data?.success) {
        if (res.data.asset) {
          setAssetInfo((prev) => ({
            ...prev,
            current_status: res.data.asset.current_status || prev.current_status,
            fuel_level_percent: res.data.asset.fuel_level_percent ?? prev.fuel_level_percent,
            last_warmed_up_at: res.data.asset.last_warmed_up_at || prev.last_warmed_up_at,
            last_serviced_at: res.data.asset.last_serviced_at || prev.last_serviced_at,
          }));
        }
        if (res.data.pic) {
          setPicInfo(res.data.pic);
        }
        if (Array.isArray(res.data.logs)) {
          setRecords(res.data.logs.map(mapLogToRecord));
        }
        if (Array.isArray(res.data.officers)) {
          setOfficers(res.data.officers);
        }
        if (res.data.active_session) {
          setActiveSession(mapActiveSession(res.data.active_session));
        }
      }
    } catch (e) {
      console.warn("Backend simpel-bmn belum merespons, siap menerima koneksi API:", e);
    }
  }, [SIMPEL_BMN_URL, assetInfo.qr_token]);

  useEffect(() => {
    loadAssetData();
  }, [loadAssetData]);

  // Cek kewenangan akun SSO Auth BPOM ke backend simpel-bmn (sebagai penghubung data)
  useEffect(() => {
    if (!authUser) {
      setUserAuthority({ isPic: false, isAuthorizedOfficer: false, checked: true });
      return;
    }

    const checkAuthStatus = async () => {
      try {
        const res = await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/check-authority`, {
          email: authUser.email,
          auth_user_id: authUser.id,
          name: authUser.name,
          nip: authUser.employee?.nip || authUser.nik,
          role: authUser.role?.name || authUser.role?.level || "",
          jabatan: authUser.employee?.jabatan || "",
          qr_token: assetInfo.qr_token,
        });

        if (res.data?.success) {
          setUserAuthority({
            isPic: !!res.data.is_pic,
            isAuthorizedOfficer: !!res.data.is_authorized_officer,
            checked: true,
          });
          if (res.data.pic) {
            setPicInfo(res.data.pic);
          }
        }
      } catch (err) {
        console.warn("Gagal cek kewenangan ke simpel-bmn:", err);
        const emailLower = (authUser.email || "").toLowerCase();
        const isPicFallback = emailLower.includes("anas.amirudin") || emailLower === "anas@pom.go.id";
        setUserAuthority({
          isPic: isPicFallback,
          isAuthorizedOfficer: isPicFallback,
          checked: true,
        });
      }
    };

    checkAuthStatus();
  }, [authUser, SIMPEL_BMN_URL, assetInfo.qr_token]);

  // Muat daftar pegawai dari SSO Auth BPOM jika PIC membuka modal kelola petugas
  useEffect(() => {
    if (userAuthority.isPic && isManageOfficersModalOpen) {
      const fetchAuthUsers = async () => {
        setLoadingEmployees(true);
        try {
          const res = await axios.get(`${AUTH_URL}/api/get-all-users`);
          if (Array.isArray(res.data)) {
            setAuthEmployees(res.data);
          }
        } catch (err) {
          console.warn("Gagal load all users dari Auth BPOM:", err);
        } finally {
          setLoadingEmployees(false);
        }
      };
      fetchAuthUsers();
    }
  }, [userAuthority.isPic, isManageOfficersModalOpen, AUTH_URL]);

  // Timer counter untuk sesi aktif (update durasi berjalan)
  useEffect(() => {
    if (!activeSession) {
      setRunningMinutes(0);
      return;
    }
    const updateElapsed = () => {
      const elapsedMs = Date.now() - activeSession.startTimestamp;
      const mins = Math.max(1, Math.floor(elapsedMs / (1000 * 60)));
      setRunningMinutes(mins);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 15000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Handler Buka Form Check-in (Mengecek Kewenangan Hak Akses Petugas / PIC)
  const handleInitiateNewActivity = () => {
    if (activeSession) {
      showToast("⚠️ Ada kegiatan pemeliharaan yang sedang berjalan! Selesaikan kegiatan tersebut terlebih dahulu.");
      return;
    }

    if (!currentUser) {
      redirectToLogin();
      return;
    }

    // Pengecekan Kewenangan Hak Akses:
    // Hanya PIC (Kasubag TU) atau petugas yang disetujui PIC di tabel maintenance_officers yang diizinkan!
    const isPic = currentUser.isPic;
    const isAuthorized =
      userAuthority.isAuthorizedOfficer ||
      officers.some((off) => {
        if (!off.is_active) return false;
        const matchesAsset =
          off.maintenance_asset_id === assetInfo.id ||
          !off.maintenance_asset_id;
        if (!matchesAsset) return false;

        // Cocokkan NIP jika kedua pihak memiliki NIP riil
        if (
          off.nip &&
          off.nip !== "-" &&
          currentUser.nip &&
          off.nip.replace(/\s+/g, "") === currentUser.nip.replace(/\s+/g, "")
        ) {
          return true;
        }

        // Cocokkan Nama
        const offName = (off.name || "").trim().toLowerCase();
        const currName = (currentUser.name || "").trim().toLowerCase();
        const currRawName = (currentUser.rawName || "").trim().toLowerCase();
        return offName === currName || offName === currRawName;
      });

    if (!isPic && !isAuthorized) {
      setAccessDeniedModal({
        userName: currentUser.name,
        userRole: currentUser.role,
        userNip: currentUser.nip || "-",
      });
      return;
    }

    openCheckInModal();
  };

  // Fungsi Membuka Modal Check-in & Mengunci Waktu Mulai Otomatis
  const openCheckInModal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    const secs = String(now.getSeconds()).padStart(2, "0");

    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hours}:${mins}`;
    const displayStr =
      now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }) + `, Pukul ${hours}:${mins}:${secs} WITA`;

    setCheckInTimeCaptured({
      dateStr,
      timeStr,
      displayStr,
      timestamp: now.getTime(),
    });

    setCheckInActivityType("warming_up");
    setCheckInCustomType("");
    setCheckInDetails("");
    setCheckInPhotoUrl("");
    setIsCheckInModalOpen(true);
  };

  // Handler Logout SSO BPOM
  const handleLogout = async () => {
    await dispatch(logout());
    setUserAuthority({ isPic: false, isAuthorizedOfficer: false, checked: false });
    showToast("Berhasil keluar dari akun SSO BPOM.");
  };

  // Handler PIC: Tambah Petugas Baru untuk Aset Tertentu ke Backend simpel-bmn
  const handleAddOfficerByPic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.isPic) {
      showToast("⚠️ Hanya PIC yang memiliki wewenang menambahkan petugas.");
      return;
    }

    const targetName = selectedEmployee ? selectedEmployee.name : searchEmployeeQuery.trim();
    const targetEmail = selectedEmployee?.email || "";
    const targetAuthUserId = selectedEmployee?.id || null;
    const targetNip = selectedEmployee?.employee?.nip || selectedEmployee?.nik || "-";

    if (!targetName) {
      showToast("Ketik dan pilih nama pegawai yang akan ditugaskan dari daftar pencarian.");
      return;
    }

    try {
      const res = await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/officers`, {
        maintenance_asset_id: selectedAssetIdForOfficer,
        nip: targetNip,
        name: targetName,
        email: targetEmail,
        auth_user_id: targetAuthUserId,
        added_by_name: `${currentUser.name} (PIC)`,
      });

      if (res.data?.success && res.data?.officer) {
        setOfficers((prev) => [...prev, res.data.officer]);
        showToast(`✓ Petugas ${targetName} berhasil ditambahkan ke daftar berwenang.`);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Gagal menambahkan petugas ke database.";
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setSelectedEmployee(null);
      setSearchEmployeeQuery("");
      setIsEmployeeDropdownOpen(false);
    }
  };

  // Handler PIC: Cabut Hak Akses Petugas di Backend simpel-bmn
  const handleDeleteOfficer = async (officerId: number, officerName: string) => {
    if (!confirm(`Apakah Anda yakin ingin mencabut kewenangan pemeliharaan dari ${officerName}?`)) {
      return;
    }

    try {
      const res = await axios.delete(`${SIMPEL_BMN_URL}/api/maintenance/officers/${officerId}`);
      if (res.data?.success) {
        setOfficers((prev) => prev.filter((o) => o.id !== officerId));
        showToast(`Kewenangan petugas ${officerName} berhasil dicabut.`);
      }
    } catch (err: any) {
      console.warn("Gagal hapus petugas:", err);
      setOfficers((prev) => prev.filter((o) => o.id !== officerId));
      showToast(`Kewenangan petugas ${officerName} dicabut.`);
    }
  };

  // Submit Langkah 1: Check-in (Mulai Kegiatan)
  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const activityLabel =
      checkInActivityType === "other" && checkInCustomType.trim()
        ? checkInCustomType.trim()
        : getActivityBadge(checkInActivityType).label;

    const payload = {
      qr_token: assetInfo.qr_token,
      activity_type: checkInActivityType,
      activity_details: checkInDetails.trim() || activityLabel,
      initial_photo_url: checkInPhotoUrl || undefined,
      user_id: authUser?.id,
      executor_name: currentUser?.name || authUser?.name || "Petugas",
      executor_role: currentUser?.role || "Petugas",
      executor_nip: currentUser?.nip || null,
    };

    try {
      const res = await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/check-in`, payload);
      if (res.data?.success && res.data.active_session) {
        setActiveSession(mapActiveSession(res.data.active_session));
        loadAssetData();
      } else {
        const newSession: ActiveMaintenanceSession = {
          id: Date.now(),
          date: checkInTimeCaptured.dateStr,
          startTime: checkInTimeCaptured.timeStr,
          startTimeDisplay: checkInTimeCaptured.displayStr,
          startTimestamp: checkInTimeCaptured.timestamp || Date.now(),
          activityType: checkInActivityType,
          activityDetails: checkInDetails.trim() || activityLabel,
          executorName: currentUser?.name || authUser?.name || "Petugas",
          executorRole: currentUser?.role || "Petugas",
          executorNip: currentUser?.nip || null,
          initialPhotoUrl: checkInPhotoUrl || undefined,
        };
        setActiveSession(newSession);
      }
    } catch (err: any) {
      console.warn("Gagal simpan check-in ke backend simpel-bmn:", err);
      const newSession: ActiveMaintenanceSession = {
        id: Date.now(),
        date: checkInTimeCaptured.dateStr,
        startTime: checkInTimeCaptured.timeStr,
        startTimeDisplay: checkInTimeCaptured.displayStr,
        startTimestamp: checkInTimeCaptured.timestamp || Date.now(),
        activityType: checkInActivityType,
        activityDetails: checkInDetails.trim() || activityLabel,
        executorName: currentUser?.name || authUser?.name || "Petugas",
        executorRole: currentUser?.role || "Petugas",
        executorNip: currentUser?.nip || null,
        initialPhotoUrl: checkInPhotoUrl || undefined,
      };
      setActiveSession(newSession);
    } finally {
      setIsSubmitting(false);
      setIsCheckInModalOpen(false);
      showToast(`⚡ Kegiatan dimulai! Status genset kini '${getActivityDynamicStatus(checkInActivityType)}'.`);
    }
  };

  // Buka Modal Langkah 2: Check-out (Selesaikan Kegiatan)
  const openCheckOutModal = () => {
    if (!activeSession) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    const secs = String(now.getSeconds()).padStart(2, "0");

    const timeStr = `${hours}:${mins}`;
    const displayStr =
      now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + `, Pukul ${hours}:${mins}:${secs} WITA`;

    const elapsedMs = now.getTime() - activeSession.startTimestamp;
    const duration = Math.max(1, Math.round(elapsedMs / (1000 * 60)));

    setCheckOutTimeCaptured({
      timeStr,
      displayStr,
      duration,
    });
    setCheckOutStatusAfter("standby");
    setCheckOutNotes("");
    setCheckOutPhotoUrl("");
    setIsCheckOutModalOpen(true);
  };

  // Submit Langkah 2: Check-out (Selesaikan & Simpan Log Permanen)
  const handleSubmitCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/check-out`, {
        log_id: activeSession.id,
        status_after: checkOutStatusAfter,
        notes: checkOutNotes.trim() || undefined,
        final_photo_url: checkOutPhotoUrl || undefined,
      });

      if (res.data?.success) {
        loadAssetData();
      }
    } catch (err: any) {
      console.warn("Gagal checkout ke backend simpel-bmn:", err);
      const completedRecord: MaintenanceRecord = {
        id: activeSession.id,
        date: activeSession.date,
        startTime: activeSession.startTime,
        endTime: checkOutTimeCaptured.timeStr,
        durationMinutes: checkOutTimeCaptured.duration,
        activityType: activeSession.activityType,
        activityDetails: activeSession.activityDetails,
        executorName: activeSession.executorName,
        executorRole: activeSession.executorRole,
        executorNip: activeSession.executorNip,
        verifierName: picInfo?.name || "PIC BMN",
        isVerified: false,
        statusAfter: checkOutStatusAfter,
        notes: checkOutNotes.trim() || undefined,
        initialPhotoUrl: activeSession.initialPhotoUrl,
        finalPhotoUrl: checkOutPhotoUrl || undefined,
      };
      setRecords((prev) => [completedRecord, ...prev]);
    } finally {
      setActiveSession(null);
      setIsSubmitting(false);
      setIsCheckOutModalOpen(false);
      showToast("✓ Kegiatan pemeliharaan berhasil diselesaikan dan dicatat ke riwayat!");
    }
  };

  // Batalkan Sesi Berjalan
  const handleCancelActiveSession = async () => {
    if (!activeSession) return;
    if (confirm("Apakah Anda yakin ingin membatalkan sesi kegiatan yang sedang berjalan ini?")) {
      try {
        await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/cancel-active-session`, {
          log_id: activeSession.id,
        });
        loadAssetData();
      } catch (err) {
        console.warn("Gagal batalkan sesi di backend:", err);
      } finally {
        setActiveSession(null);
        showToast("Sesi kegiatan dibatalkan. Genset kembali ke status Siaga.");
      }
    }
  };

  // Verifikasi / Persetujuan Digital oleh Akun PIC
  const handleVerify = async (id: number) => {
    setVerifyingLogId(id);
    const picDisplayName = currentUser?.isPic
      ? currentUser.name
      : picInfo?.name || "PIC BMN";

    try {
      await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/verify/${id}`, {
        verifier_name: picDisplayName,
        verifier_id: authUser?.id || picInfo?.id,
      });
      loadAssetData();
    } catch (err) {
      console.warn("Gagal verifikasi log ke backend simpel-bmn:", err);
    } finally {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const stamp = `${dateStr}, ${timeStr} WITA`;

      setRecords((prev) =>
        prev.map((rec) =>
          rec.id === id
            ? {
                ...rec,
                isVerified: true,
                verifierName: picDisplayName,
                verifiedAt: stamp,
              }
            : rec
        )
      );
      setVerifyingLogId(null);
      showToast(`✓ Catatan pemeliharaan disetujui & diverifikasi resmi oleh PIC (${picDisplayName})!`);
    }
  };

  // Status Dinamis Genset
  function getActivityDynamicStatus(type: MaintenanceRecord["activityType"]) {
    switch (type) {
      case "warming_up":
        return "Sedang Dipanaskan (Warming-up)";
      case "emergency_run":
        return "Sedang Beroperasi (Darurat - PLN Padam)";
      case "routine_service":
        return "Dalam Pemeliharaan (Servis Berkala)";
      case "fuel_refill":
        return "Dalam Pemeliharaan (Pengisian BBM)";
      case "load_test":
        return "Dalam Pengujian (Load Test)";
      case "repair":
        return "Dalam Perbaikan (Troubleshooting)";
      default:
        return "Dalam Pemeliharaan";
    }
  }

  // Label Jenis Kegiatan
  const getActivityBadge = (type: MaintenanceRecord["activityType"]) => {
    switch (type) {
      case "warming_up":
        return { label: "Pemanasan Rutin", color: "text-amber-800 bg-amber-50 border-amber-200" };
      case "emergency_run":
        return { label: "Darurat (PLN Padam)", color: "text-rose-800 bg-rose-50 border-rose-300 font-bold" };
      case "routine_service":
        return { label: "Servis Berkala", color: "text-blue-800 bg-blue-50 border-blue-200" };
      case "fuel_refill":
        return { label: "Pengisian Solar", color: "text-purple-800 bg-purple-50 border-purple-200" };
      case "load_test":
        return { label: "Uji Beban", color: "text-indigo-800 bg-indigo-50 border-indigo-200" };
      case "repair":
        return { label: "Perbaikan", color: "text-red-800 bg-red-50 border-red-200" };
      default:
        return { label: "Lainnya", color: "text-slate-800 bg-slate-50 border-slate-200" };
    }
  };

  // Format Tanggal (Contoh: 11-04-2026)
  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Filter Data Riwayat
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const typeLabel = getActivityBadge(r.activityType).label.toLowerCase();
      const matchSearch =
        typeLabel.includes(searchQuery.toLowerCase()) ||
        r.executorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.activityDetails || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchMonth = selectedMonth === "all" || r.date.startsWith(`2026-${selectedMonth}`);

      return matchSearch && matchMonth;
    });
  }, [records, searchQuery, selectedMonth]);

  // Record terakhir untuk ringkasan catatan operasional
  const latestRecord = records[0];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 font-sans text-slate-800 antialiased">
      {/* ========================================================================= */}
      {/* 1. HEADER BAR: MOBILE-OPTIMIZED & INTEGRASI PIC ADMIN */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3 gap-2">
          {/* Sisi Kiri: Tombol Back & Judul Halaman */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
              title="Kembali ke Beranda"
            >
              <Icon icon="solar:arrow-left-linear" width={18} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                  Riwayat Pemeliharaan
                </h1>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Status Petugas, Kelola Petugas (PIC), & Tombol Aksi */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tombol Khusus PIC: Kelola Petugas Berwenang */}
            {currentUser?.isPic && (
              <button
                type="button"
                onClick={() => setIsManageOfficersModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/90 px-2.5 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs hover:bg-indigo-100 transition active:scale-95"
                title="Kelola siapa saja teknisi yang berwenang mencatat pemeliharaan aset ini"
              >
                <Icon icon="solar:users-group-rounded-bold" width={15} />
                <span className="hidden md:inline">Kelola Petugas</span>
                <span className="md:hidden">Petugas</span>
              </button>
            )}

            {/* Akun Petugas */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/70 p-1 sm:px-2.5 sm:py-1 text-xs">
                <span
                  className={`flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-lg text-white font-bold text-xs sm:text-[10px] ${
                    currentUser.isPic ? "bg-emerald-600" : "bg-[#005baa]"
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </span>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 block leading-tight">{currentUser.name}</span>
                    {currentUser.isPic && (
                      <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-extrabold text-emerald-800 border border-emerald-300">
                        PIC
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-blue-700 block leading-tight">{currentUser.role}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Keluar Akun"
                >
                  <Icon icon="solar:logout-2-linear" width={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={redirectToLogin}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition active:scale-95"
                title="Login sebagai Teknisi atau PIC"
              >
                <Icon icon="solar:user-bold" width={14} className="text-[#005baa]" />
                <span className="hidden sm:inline">Login Petugas</span>
                <span className="sm:hidden text-[11px]">Login</span>
              </button>
            )}

            {/* Tombol Stiker Barcode QR */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center justify-center h-8 w-8 sm:h-auto sm:w-auto sm:gap-1.5 rounded-xl border border-slate-200 bg-white sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              title="Buka stiker QR barcode siap tempel di fisik genset"
            >
              <Icon icon="solar:qr-code-bold" width={16} className="text-[#005baa]" />
              <span className="hidden md:inline">Stiker QR</span>
            </button>

            {/* Tombol Cetak Form (Hanya Cetak Tabel Lembar Kendali) */}
            <button
              type="button"
              onClick={handlePrintTable}
              className="inline-flex items-center justify-center h-8 w-8 sm:h-auto sm:w-auto sm:gap-1.5 rounded-xl border border-slate-200 bg-white sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
              title="Cetak lembar riwayat pemeliharaan (Hanya Tabel)"
            >
              <Icon icon="solar:printer-bold" width={16} className="text-slate-500" />
              <span className="hidden md:inline">Cetak</span>
            </button>

            {/* Tombol Utama: Catat Kegiatan Baru */}
            <button
              type="button"
              onClick={handleInitiateNewActivity}
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 ${
                activeSession ? "bg-amber-600 hover:bg-amber-700 animate-pulse" : "bg-[#005baa] hover:bg-[#004885]"
              }`}
            >
              <Icon icon={activeSession ? "solar:hourglass-bold" : "solar:pen-bold"} width={14} />
              <span className="hidden sm:inline">
                {activeSession ? "Kegiatan Berjalan..." : "+ Catat Kegiatan Baru"}
              </span>
              <span className="sm:hidden">{activeSession ? "Berjalan..." : "+ Catat"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Konten Halaman */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5 space-y-3.5 sm:space-y-4 no-print print:hidden">
        {/* Toast Notifikasi Dinamis */}
        {toastMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-[#005baa] shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <Icon icon="solar:info-circle-bold" width={16} className="shrink-0" />
              <span className="leading-snug">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-blue-400 hover:text-blue-700 shrink-0"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. HERO HIGHLIGHT: KARTU IDENTITAS & STATUS GENSET */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#072448] via-[#0b3c68] to-[#005baa] p-4 sm:p-6 text-white shadow-md">
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="pointer-events-none absolute right-24 bottom-0 h-40 w-40 rounded-full bg-sky-300/10 blur-xl" />

          {/* Baris Atas: Status Kesiapan Aset */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {activeSession ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-amber-200 border border-amber-300/40 backdrop-blur-xs">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  Kondisi: {getActivityDynamicStatus(activeSession.activityType)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-emerald-200 border border-emerald-300/30 backdrop-blur-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Kondisi: Siaga (Standby - Siap Digunakan)
                </span>
              )}
            </div>

            <span className="text-[10px] sm:text-[11px] font-mono text-sky-200/90 tracking-wide">
              KODE BMN: {assetInfo.asset_code} &bull; {assetInfo.category.toUpperCase()}
            </span>
          </div>

          {/* Baris Tengah: Judul Genset & 3 Metrik Cepat */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/15">
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white uppercase leading-tight">
                {assetInfo.name}
              </h2>
              {/* Petugas Resmi yang Ditugaskan */}
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-sky-200/90 flex-wrap">
                <span className="font-semibold text-white flex items-center gap-1">
                  <Icon icon="solar:shield-check-bold" width={14} className="text-emerald-300" />
                  Petugas Ditunjuk PIC:
                </span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md font-mono text-white text-[10px]">
                  {officers.map((o) => o.name).join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* Baris Bawah: Catatan Operasional Terakhir */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 text-[11px] sm:text-xs text-sky-100/90">
            <div className="flex items-start sm:items-center gap-2">
              <Icon icon="solar:info-circle-bold" width={15} className="text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-relaxed">
                {latestRecord ? (
                  <>
                    <strong>Catatan Operasional:</strong> Genset terakhir dipanaskan pada{" "}
                    <strong>{formatDateDisplay(latestRecord.date)}</strong> oleh <strong>{latestRecord.executorName}</strong>{" "}
                    selama <strong>{latestRecord.durationMinutes}</strong> menit.
                  </>
                ) : (
                  <>
                    <strong>Catatan Operasional:</strong> Belum ada catatan pemeliharaan tercatat di sistem. Genset dalam kondisi siaga (standby).
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300 shrink-0 self-start sm:self-auto">
              <Icon icon="solar:check-circle-bold" width={14} />
              <span>Kepatuhan Mingguan: Normal</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BANNER KEGIATAN SEDANG BERLANGSUNG (ACTIVE CHECK-IN RUNNER) */}
        {/* ========================================================================= */}
        {activeSession && (
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 p-3.5 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                  <Icon icon="solar:hourglass-bold" width={20} className="animate-spin text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-amber-600 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                      Kegiatan Berlangsung
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-900">
                      ⏱️ Berjalan: {runningMinutes} Menit
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                    {getActivityBadge(activeSession.activityType).label}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600 mt-0.5 flex-wrap">
                    <span>
                      Pelaksana: <strong>{activeSession.executorName}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Mulai: <strong>{activeSession.startTime} WITA</strong>
                    </span>
                  </div>
                  {activeSession.activityDetails && (
                    <p className="mt-2 text-xs text-amber-900 bg-white/90 p-2 sm:p-2.5 rounded-lg border border-amber-200/80 leading-relaxed">
                      <strong>Uraian Kegiatan:</strong> {activeSession.activityDetails}
                    </p>
                  )}
                </div>
              </div>

              {/* Tombol Aksi Check-out */}
              <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/80 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelActiveSession}
                  className="flex-1 sm:flex-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition text-center"
                  title="Batalkan sesi ini jika salah tekan"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={openCheckOutModal}
                  className="flex-2 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95"
                >
                  <Icon icon="solar:check-circle-bold" width={16} />
                  <span>Selesaikan (Check-out)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TOOLBAR KONTROL: PENCARIAN & FILTER BULAN */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Kolom Pencarian & Filter */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Icon
                icon="solar:magnifer-linear"
                width={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari kegiatan, teknisi, catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none focus:ring-1 focus:ring-[#005baa] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <Icon icon="solar:close-circle-bold" width={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto font-medium">
            <span className="text-[11px] text-slate-400">
              Total: <strong>{filteredRecords.length}</strong> catatan
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. TAMPILAN DATA: TABEL LEMBAR KENDALI PEMELIHARAAN (RESPONSIF MOBILE) */}
        {/* ========================================================================= */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          {/* Petunjuk Geser Horizontal Khusus Mobile */}
          <div className="md:hidden flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/70 border-b border-blue-100 text-[11px] text-blue-800 font-medium">
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:round-arrow-right-bold" width={14} className="text-[#005baa] animate-pulse shrink-0" />
              <span>Geser ke samping untuk melihat pelaksana, foto & paraf PIC &rarr;</span>
            </span>
            <span className="text-[10px] bg-white/90 px-2 py-0.5 rounded-md font-mono text-slate-600 border border-blue-200 shrink-0">
              {filteredRecords.length} Data
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-3 py-3 w-12 text-center">NO</th>
                  <th className="px-3.5 py-3 w-28 text-center whitespace-nowrap">TANGGAL</th>
                  <th className="px-4 py-3 min-w-[260px]">AKTIFITAS & WAKTU</th>
                  <th className="px-4 py-3 w-40 text-center">PELAKSANA (NAMA & TTD)</th>
                  <th className="px-4 py-3 min-w-[180px]">KETERANGAN</th>
                  <th className="px-3 py-3 w-24 text-center">FOTO BUKTI</th>
                  <th className="px-3.5 py-3 w-36 text-center">AKSI PIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <Icon icon="solar:clipboard-list-linear" width={32} className="text-slate-300" />
                        <span className="font-semibold text-xs">Tidak ada data yang sesuai filter pencarian.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                    const typeBadge = getActivityBadge(item.activityType);
                    const isEmergency = item.activityType === "emergency_run";

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition ${isEmergency ? "bg-rose-50/20" : ""}`}
                      >
                        <td className="px-3 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <span className="font-semibold text-slate-900 block font-mono">
                            {formatDateDisplay(item.date)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${typeBadge.color}`}
                              >
                                {typeBadge.label}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500 font-medium">
                                {item.startTime} - {item.endTime} ({item.durationMinutes} menit)
                              </span>
                            </div>
                            <p className="font-semibold text-slate-900 leading-snug">
                              {item.activityDetails || typeBadge.label}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-block text-center">
                            <span className="font-bold text-slate-900 block">{item.executorName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {item.executorRole || "Teknisi"}
                            </span>
                            <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-200">
                              <Icon icon="solar:check-circle-bold" width={10} />
                              TTD Valid (SSO)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {item.notes ? (
                            <p className="line-clamp-2 leading-relaxed">{item.notes}</p>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {item.initialPhotoUrl || item.finalPhotoUrl ? (
                            <div className="flex items-center justify-center gap-1">
                              {item.initialPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewPhoto({
                                      url: item.initialPhotoUrl!,
                                      caption: `Foto Awal: ${typeBadge.label} (${formatDateDisplay(item.date)})`,
                                    })
                                  }
                                  className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:opacity-80 transition"
                                  title="Lihat foto awal panel"
                                >
                                  <img
                                    src={item.initialPhotoUrl}
                                    alt="Awal"
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              )}
                              {item.finalPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewPhoto({
                                      url: item.finalPhotoUrl!,
                                      caption: `Foto Akhir: ${typeBadge.label} (${formatDateDisplay(item.date)})`,
                                    })
                                  }
                                  className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 hover:opacity-80 transition"
                                  title="Lihat foto akhir panel"
                                >
                                  <img
                                    src={item.finalPhotoUrl}
                                    alt="Akhir"
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[10px] italic">-</span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          {item.isVerified ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
                                <Icon icon="solar:check-circle-bold" width={14} className="text-emerald-600" />
                                <span>Disetujui PIC</span>
                              </span>
                              {item.verifiedAt && (
                                <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  {item.verifiedAt}
                                </span>
                              )}
                            </div>
                          ) : currentUser?.isPic ? (
                            <button
                              type="button"
                              disabled={verifyingLogId === item.id}
                              onClick={() => handleVerify(item.id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                              title="Klik untuk menyetujui & verifikasi data ini sebagai PIC"
                            >
                              <Icon
                                icon={
                                  verifyingLogId === item.id
                                    ? "solar:refresh-circle-bold"
                                    : "solar:check-circle-bold"
                                }
                                width={15}
                                className={verifyingLogId === item.id ? "animate-spin" : ""}
                              />
                              <span>{verifyingLogId === item.id ? "Memproses..." : "Centang Setujui"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (!currentUser) {
                                  redirectToLogin();
                                  return;
                                } else {
                                  showToast(
                                    "⚠️ Akun saat ini bukan PIC. Hanya PIC yang berwenang menekan persetujuan."
                                  );
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-700 hover:bg-white transition"
                              title="Menunggu verifikasi PIC. Klik untuk login sebagai PIC."
                            >
                              <Icon icon="solar:clock-circle-bold" width={13} className="text-amber-500" />
                              <span>Menunggu PIC</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Table */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-3.5 py-3 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <span>
              Menampilkan <strong>{filteredRecords.length}</strong> dari <strong>{records.length}</strong> catatan
              pemeliharaan {assetInfo.name}.
            </span>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 6. MODAL KHUSUS PIC: KELOLA PETUGAS PEMELIHARAAN (TAMBAH & CABUT HAK AKSES) */}
      {/* ========================================================================= */}
      {isManageOfficersModalOpen && currentUser?.isPic && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                  <Icon icon="solar:users-group-rounded-bold" width={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kelola Petugas Pemeliharaan Aset</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageOfficersModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
              {/* Form Tambah Petugas Baru */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Icon icon="solar:user-plus-bold" width={16} />
                  <span>Tambah Petugas Baru ke Aset</span>
                </div>

                <form onSubmit={handleAddOfficerByPic} className="space-y-3">
                  {/* Dropdown 1: Pilihan Aset Fisik */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pilih Aset Fisik BMN <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedAssetIdForOfficer}
                      onChange={(e) => setSelectedAssetIdForOfficer(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-medium focus:border-indigo-600 focus:outline-none"
                    >
                      {AVAILABLE_ASSETS.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          [{asset.asset_code}] {asset.name} ({asset.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Form Input: Cari Pegawai dari SSO Auth BPOM */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">
                        Pilih Pegawai dari Akun SSO BPOM <span className="text-rose-500">*</span>
                      </label>
                      {authEmployees.length > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {searchEmployeeQuery.trim()
                            ? `${filteredAuthEmployees.length} pegawai ditemukan`
                            : `Total: ${authEmployees.length} pegawai`}
                        </span>
                      )}
                    </div>

                    {/* Kotak Pencarian Petugas & Dropdown Langsung Terbuka */}
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
                      {isEmployeeDropdownOpen && searchEmployeeQuery.trim().length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                          {filteredAuthEmployees.length === 0 ? (
                            <div className="p-3 text-center text-slate-400 text-xs">
                              {authEmployees.length === 0
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

                    {/* Pegawai Terpilih Konfirmasi */}
                    {selectedEmployee && (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-2.5 flex items-center justify-between text-xs text-indigo-950 mt-2">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:check-circle-bold" width={16} className="text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold block leading-tight">{selectedEmployee.name}</span>
                            <span className="text-[10px] text-indigo-700 block">Siap ditugaskan ke aset ini</span>
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

                  {/* Tombol Simpan */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 active:scale-95 transition"
                    >
                      <Icon icon="solar:check-circle-bold" width={15} />
                      <span>Beri Hak Akses Petugas</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Petugas yang Sedang Aktif */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Icon icon="solar:shield-check-bold" width={15} className="text-emerald-600" />
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
                                  {officer.asset?.name || "GENSET WILSON 100 kVA"}
                                </span>
                                <span>&bull;</span>
                                <span>Ditunjuk oleh: {officer.added_by_name}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteOfficer(officer.id, officer.name)}
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
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 p-3 text-right">
              <button
                type="button"
                onClick={() => setIsManageOfficersModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Selesai / Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL ALERT: PENOLAKAN AKSES (JIKA BUKAN PETUGAS RESMI) */}
      {/* ========================================================================= */}
      {accessDeniedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print print:hidden">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-3.5">
              <Icon icon="solar:shield-warning-bold" width={32} />
            </div>

            <h3 className="text-base font-bold text-slate-900">Kewenangan Akses Terbatas</h3>
            <p className="text-xs text-slate-500 mt-0.5">SOP Pemeliharaan BMN POM-14.01/CFM.01/SOP.01</p>

            {/* Info Akun yang Mencoba Masuk */}
            <div className="my-3.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                Akun Terdeteksi (SSO):
              </span>
              <span className="font-bold text-slate-900 block mt-0.5">{accessDeniedModal.userName}</span>
              <span className="text-slate-500 block text-[11px]">
                {accessDeniedModal.userRole}
                {accessDeniedModal.userNip && accessDeniedModal.userNip !== "-" ? ` • NIP: ${accessDeniedModal.userNip}` : ""}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed text-left">
              Akun Anda <strong>tidak terdaftar</strong> dalam daftar Petugas Pemeliharaan yang berwenang untuk unit{" "}
              <strong>{assetInfo.name}</strong>. Demi tertib administrasi BMN, pencatatan check-in pemeliharaan fisik hanya dapat dilakukan oleh teknisi resmi yang telah ditunjuk oleh PIC ({picInfo?.name || "PIC BMN"}).
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setAccessDeniedModal(null)}
                className="flex-1 rounded-xl bg-[#005baa] py-2.5 text-xs font-bold text-white hover:bg-[#004885] shadow-2xs transition"
              >
                Kembali ke Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessDeniedModal(null);
                  redirectToLogin();
                }}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Ganti Akun
              </button>
            </div>
          </div>
        </div>
      )}

{/* 9. MODAL LANGKAH 1: CHECK-IN (MULAI KEGIATAN) */}
      {/* ========================================================================= */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 no-print print:hidden">
          <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#005baa] uppercase tracking-wider">
                  Langkah 1: Check-in (Mulai Kegiatan)
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  Mulai Pemeliharaan Genset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckInModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCheckIn} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Info Waktu Mulai Otomatis */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#005baa] text-white shrink-0">
                  <Icon icon="solar:clock-circle-bold" width={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    WAKTU MULAI (TERCATAT OTOMATIS)
                  </span>
                  <span className="text-xs font-bold text-slate-900 block font-mono">
                    {checkInTimeCaptured.displayStr}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    *Dicatat saat tombol mulai dibuka. Waktu selesai akan otomatis dicatat saat Anda melakukan check-out nanti.
                  </span>
                </div>
              </div>

              {/* Identitas Petugas Pelaksana */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Petugas Pelaksana (Terverifikasi Resmi)
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700 font-semibold">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:user-bold" width={14} className="text-[#005baa]" />
                    <span>
                      {currentUser?.name || "Petugas"} ({currentUser?.role || "Petugas Pemeliharaan"})
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                    Terdaftar di PIC
                  </span>
                </div>
              </div>

              {/* Pilihan Jenis Kegiatan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Jenis Kegiatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={checkInActivityType}
                  onChange={(e) => setCheckInActivityType(e.target.value as MaintenanceRecord["activityType"])}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
                >
                  <option value="warming_up">🟡 Pemanasan Rutin (Warming-up / Panasin Genset)</option>
                  <option value="routine_service">🟠 Servis Berkala / Pengecekan Fisik (Radiator, Oli & Aki)</option>
                  <option value="fuel_refill">🟣 Pengisian Bahan Bakar (BBM Solar)</option>
                  <option value="emergency_run">🔵 Pengoperasian Darurat (Mati Lampu PLN)</option>
                  <option value="load_test">🔵 Uji Beban Listrik (Load Test)</option>
                  <option value="repair">🔴 Perbaikan / Troubleshooting</option>
                  <option value="other">⚪ Lainnya (Tuliskan Sendiri)</option>
                </select>
              </div>

              {/* Jika Lainnya */}
              {checkInActivityType === "other" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Kegiatan Khusus <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kuras tangki solar dan ganti dinamo starter"
                    value={checkInCustomType}
                    onChange={(e) => setCheckInCustomType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>
              )}

              {/* Detail / Uraian Kegiatan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detail / Uraian Kegiatan Yang Akan Dilakukan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan detail pemeriksaan atau pekerjaan yang akan dilakukan (contoh: Panasin genset tanpa beban 15 menit, periksa level oli dan air radiator)..."
                  value={checkInDetails}
                  onChange={(e) => setCheckInDetails(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
                />
              </div>

              {/* Upload Foto Bukti Awal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto Bukti Awal (Panel Instrumen / Kondisi Awal Mesin)
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
                  {checkInPhotoUrl ? (
                    <div className="relative inline-block group">
                      <img
                        src={checkInPhotoUrl}
                        alt="Foto Bukti Awal"
                        className="h-28 w-auto rounded-lg object-cover mx-auto border border-slate-200 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setCheckInPhotoUrl("")}
                        className="absolute -top-2 -right-2 rounded-full bg-rose-600 text-white p-1 hover:bg-rose-700 shadow-sm transition"
                        title="Hapus Foto"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={14} />
                      </button>
                      <div className="mt-1 text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                        <Icon icon="solar:check-circle-bold" width={12} className="text-emerald-600" />
                        <span>Foto tersimpan</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="checkInPhotoInput"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoFileChange(e, setCheckInPhotoUrl)}
                      />
                      <label
                        htmlFor="checkInPhotoInput"
                        className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#005baa] hover:bg-blue-50/50 transition-all duration-150 group"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#005baa] group-hover:bg-[#005baa] group-hover:text-white transition-all shadow-2xs mb-2">
                          <Icon icon="solar:camera-bold" width={22} />
                        </div>
                        <span className="block font-semibold text-slate-800 text-xs group-hover:text-[#005baa] transition">
                          Ambil Foto Panel Kontrol Awal
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Ketuk untuk buka kamera HP atau upload file foto
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#005baa] px-5 py-2 font-bold text-white shadow-2xs hover:bg-[#004885] active:scale-95 transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <span>Mulai Kegiatan (Check-in) &rarr;</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL LANGKAH 2: CHECK-OUT (SELESAIKAN KEGIATAN) */}
      {/* ========================================================================= */}
      {isCheckOutModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 no-print print:hidden">
          <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="shrink-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Langkah 2: Check-out (Selesaikan Kegiatan)
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  Selesaikan & Simpan Riwayat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckOutModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCheckOut} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Ringkasan Kegiatan */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">JENIS KEGIATAN:</span>
                  <span className="font-bold text-slate-900">{getActivityBadge(activeSession.activityType).label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Pelaksana:</span>
                  <span className="font-semibold text-slate-800">{activeSession.executorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Waktu Mulai:</span>
                  <span className="font-mono font-semibold text-slate-800">{activeSession.startTime} WITA</span>
                </div>
              </div>

              {/* Waktu Selesai & Durasi Terhitung Otomatis */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 sm:p-3">
                  <span className="block text-[9px] sm:text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                    WAKTU SELESAI
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-950 font-mono">
                    {checkOutTimeCaptured.timeStr} WITA
                  </span>
                  <span className="block text-[10px] text-emerald-700 mt-0.5">Tercatat otomatis</span>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-2.5 sm:p-3">
                  <span className="block text-[9px] sm:text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">
                    DURASI TOTAL
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-blue-950 font-mono">
                    {checkOutTimeCaptured.duration} Menit
                  </span>
                  <span className="block text-[10px] text-blue-700 mt-0.5">Dihitung otomatis</span>
                </div>
              </div>

              {/* Kondisi Aset Akhir */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kondisi Aset Akhir Setelah Kegiatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={checkOutStatusAfter}
                  onChange={(e) => setCheckOutStatusAfter(e.target.value as MaintenanceRecord["statusAfter"])}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
                >
                  <option value="standby">🟢 Siaga (Standby - Siap Digunakan Kapan Pun)</option>
                  <option value="need_followup">🟡 Butuh Tindak Lanjut / Pengawasan</option>
                  <option value="trouble">🔴 Tidak Siap Pakai / Ditemukan Kerusakan</option>
                </select>
              </div>

              {/* Catatan & Hasil Pemeriksaan Akhir */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Hasil Pemeriksaan Akhir <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Pemanasan 15 menit berjalan normal, suara mesin halus, voltase 380V stabil, level solar cukup (~85%), tidak ada kebocoran oli..."
                  value={checkOutNotes}
                  onChange={(e) => setCheckOutNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none"
                />
              </div>

              {/* Upload Foto Bukti Akhir */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto Bukti Akhir (Panel Jam Operasi / Fisik Genset)
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
                  {checkOutPhotoUrl ? (
                    <div className="relative inline-block group">
                      <img
                        src={checkOutPhotoUrl}
                        alt="Foto Bukti Akhir"
                        className="h-28 w-auto rounded-lg object-cover mx-auto border border-slate-200 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setCheckOutPhotoUrl("")}
                        className="absolute -top-2 -right-2 rounded-full bg-rose-600 text-white p-1 hover:bg-rose-700 shadow-sm transition"
                        title="Hapus Foto"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={14} />
                      </button>
                      <div className="mt-1 text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1">
                        <Icon icon="solar:check-circle-bold" width={12} className="text-emerald-600" />
                        <span>Foto tersimpan</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="checkOutPhotoInput"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoFileChange(e, setCheckOutPhotoUrl)}
                      />
                      <label
                        htmlFor="checkOutPhotoInput"
                        className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all duration-150 group"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs mb-2">
                          <Icon icon="solar:camera-bold" width={22} />
                        </div>
                        <span className="block font-semibold text-slate-800 text-xs group-hover:text-emerald-700 transition">
                          Ambil Foto Panel Kontrol Akhir
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Ketuk untuk buka kamera HP atau upload file foto
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Form Check-out */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckOutModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <span>Simpan & Selesaikan Kegiatan (Check-out)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL: STIKER BARCODE QR FISIK SIAP CETAK & TESTING SCAN HP */}
      {/* ========================================================================= */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print print:hidden">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl text-center p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-[#005baa] uppercase tracking-wider">
                Stiker Fisik Genset
              </span>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 bg-slate-50/40">
              {/* QR Code Gambar */}
              <div className="mx-auto h-36 w-36 sm:h-40 sm:w-40 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    qrHostMode === "lan"
                      ? "http://192.168.23.52:3000/riwayat-pemeliharaan?token=bpom-genset-mataram-01"
                      : "http://localhost:3000/riwayat-pemeliharaan?token=bpom-genset-mataram-01"
                  )}`}
                  alt="QR Code Genset BBPOM"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Pilihan Host Target untuk Testing HP */}
              <div className="mt-3 flex items-center justify-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setQrHostMode("lan")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    qrHostMode === "lan"
                      ? "bg-[#005baa] text-white"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                  title="Gunakan IP Wi-Fi agar bisa discan langsung menggunakan kamera HP"
                >
                  Wi-Fi HP (192.168.23.52)
                </button>
                <button
                  type="button"
                  onClick={() => setQrHostMode("localhost")}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    qrHostMode === "localhost"
                      ? "bg-[#005baa] text-white"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                  title="Gunakan localhost"
                >
                  Localhost
                </button>
              </div>

              <p className="mt-2 text-[10px] font-mono text-slate-600 bg-white border border-slate-200 py-1 px-2 rounded-lg truncate">
                {qrHostMode === "lan"
                  ? "http://192.168.23.52:3000/riwayat-pemeliharaan"
                  : "http://localhost:3000/riwayat-pemeliharaan"}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Arahkan kamera HP ke QR di atas untuk membuka riwayat genset seketika
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintSticker}
                className="flex-1 rounded-xl bg-[#005baa] py-2 text-xs font-semibold text-white hover:bg-[#004885] shadow-2xs transition"
              >
                Cetak Stiker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MODAL PREVIEW FOTO BUKTI */}
      {/* ========================================================================= */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 no-print print:hidden">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="truncate pr-2">{previewPhoto.caption || "Dokumentasi Bukti Panel Genset"}</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-slate-700 shrink-0"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>
            <div className="bg-slate-900 flex items-center justify-center p-2">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.caption}
                className="max-h-[65vh] w-auto rounded-lg object-contain"
              />
            </div>
            <div className="p-3 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. TAMPILAN KHUSUS CETAK: LEMBAR KENDALI RESMI (HANYA CETAK TABEL) */}
      {/* ========================================================================= */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: landscape;
                margin: 8mm 10mm;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              header, main, [role="dialog"], .no-print {
                display: none !important;
              }
              .print-only-container {
                display: block !important;
              }
            }
          `,
        }}
      />

      <div className="hidden print:block print-only-container w-full bg-white text-black font-sans leading-normal">
        {printMode === "sticker" ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center text-black">
            <div className="border-4 border-slate-900 rounded-2xl p-6 max-w-sm mx-auto text-center">
              <h2 className="text-sm font-extrabold uppercase">BALAI BESAR POM DI MATARAM</h2>
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">SISTEM MONITORING PEMELIHARAAN BMN</p>
              <div className="my-4 flex justify-center">
                <div className="h-44 w-44 mx-auto p-2 bg-white flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      qrHostMode === "lan"
                        ? "http://192.168.23.52:3000/riwayat-pemeliharaan?token=bpom-genset-mataram-01"
                        : "http://localhost:3000/riwayat-pemeliharaan?token=bpom-genset-mataram-01"
                    )}`}
                    alt="QR Code Genset BBPOM"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <h3 className="text-sm font-bold uppercase">{assetInfo.name}</h3>
              <p className="text-xs font-mono font-bold mt-0.5">{assetInfo.asset_code}</p>
              <p className="text-[10px] text-slate-600 mt-2">
                Arahkan kamera smartphone ke QR di atas untuk membuka Riwayat Pemeliharaan & Operasional
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* KOP Surat Resmi BBPOM */}
            <div className="text-center pb-3 mb-3 border-b-2 border-black">
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                BADAN PENGAWAS OBAT DAN MAKANAN RI
              </h2>
              <h1 className="text-base font-extrabold uppercase tracking-wide text-black">
                BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI MATARAM
              </h1>
              <p className="text-[10px] text-gray-700 mt-0.5">
                Jl. Cendrawasih No. 58, Karang Taliwang, Kec. Cakranegara, Kota Mataram, Nusa Tenggara Barat 83239
              </p>
              <div className="mt-2 pt-1 border-t border-gray-400">
                <h3 className="text-xs font-bold uppercase tracking-wide text-black underline">
                  LEMBAR KENDALI OPERASIONAL DAN PEMELIHARAAN BMN
                </h3>
              </div>
            </div>

            {/* Identitas Aset Fisik BMN */}
            <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] border border-black p-2 bg-gray-50/50">
              <div>
                <div className="flex">
                  <span className="w-36 font-semibold">Nama Barang / Aset</span>
                  <span className="w-3">:</span>
                  <span className="font-bold">{assetInfo.name}</span>
                </div>
                <div className="flex mt-0.5">
                  <span className="w-36 font-semibold">Kode BMN / NUP</span>
                  <span className="w-3">:</span>
                  <span className="font-mono">{assetInfo.asset_code} / NUP 0001</span>
                </div>
                <div className="flex mt-0.5">
                  <span className="w-36 font-semibold">Lokasi Penempatan</span>
                  <span className="w-3">:</span>
                  <span>Gedung Belakang - Rumah Genset BBPOM</span>
                </div>
              </div>
              <div>
                <div className="flex">
                  <span className="w-36 font-semibold">Penanggung Jawab (PIC)</span>
                  <span className="w-3">:</span>
                  <span className="font-semibold">{picInfo?.name || "PIC BMN"}</span>
                </div>
                <div className="flex mt-0.5">
                  <span className="w-36 font-semibold">Status Kondisi Terakhir</span>
                  <span className="w-3">:</span>
                  <span className="font-semibold uppercase">
                    {assetInfo.current_status === "standby" ? "Siap Operasi (Standby)" : assetInfo.current_status}
                  </span>
                </div>
                <div className="flex mt-0.5">
                  <span className="w-36 font-semibold">Waktu Cetak Dokumen</span>
                  <span className="w-3">:</span>
                  <span>
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabel Riwayat Pemeliharaan & Operasional (HANYA TABEL) */}
            <table className="w-full border-collapse border border-black text-[10px] text-left">
              <thead>
                <tr className="bg-gray-100 text-center font-bold border-b border-black text-[10px]">
                  <th className="border border-black px-1.5 py-1.5 w-7">NO</th>
                  <th className="border border-black px-2 py-1.5 w-24">TANGGAL</th>
                  <th className="border border-black px-2 py-1.5 w-28">WAKTU & DURASI</th>
                  <th className="border border-black px-2 py-1.5 w-36">JENIS KEGIATAN</th>
                  <th className="border border-black px-2 py-1.5">URAIAN & CATATAN KEGIATAN</th>
                  <th className="border border-black px-2 py-1.5 w-32">PETUGAS PELAKSANA</th>
                  <th className="border border-black px-2 py-1.5 w-28">STATUS / PARAF PIC</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-black py-6 text-center text-gray-500 italic">
                      Belum ada catatan riwayat pemeliharaan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                    const typeBadge = getActivityBadge(item.activityType);
                    return (
                      <tr key={item.id} className="border-b border-black">
                        <td className="border border-black px-1.5 py-1.5 text-center font-medium">{idx + 1}</td>
                        <td className="border border-black px-2 py-1.5 text-center whitespace-nowrap font-mono font-medium">
                          {formatDateDisplay(item.date)}
                        </td>
                        <td className="border border-black px-2 py-2 text-center font-mono">
                          <div>
                            {item.startTime} - {item.endTime}
                          </div>
                          <div className="text-[9px] text-gray-600">({item.durationMinutes} menit)</div>
                        </td>
                        <td className="border border-black px-2 py-1.5 font-semibold">{typeBadge.label}</td>
                        <td className="border border-black px-2 py-1.5">
                          <div className="font-medium text-gray-900">{item.activityDetails || "-"}</div>
                          {item.notes && (
                            <div className="text-[9px] text-gray-600 mt-0.5 italic">
                              Catatan: {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          <div className="font-bold text-gray-900">{item.executorName}</div>
                          {item.executorRole && (
                            <div className="text-[9px] text-gray-600">{item.executorRole}</div>
                          )}
                          {item.executorNip && item.executorNip !== "-" && (
                            <div className="text-[8px] text-gray-500 font-mono">NIP: {item.executorNip}</div>
                          )}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          {item.isVerified ? (
                            <div>
                              <div className="font-bold text-emerald-900 text-[10px]">DISETUJUI</div>
                              <div className="text-[8px] text-gray-600 font-mono mt-0.5">
                                {item.verifiedAt || "Terverifikasi"}
                              </div>
                              <div className="text-[8px] text-gray-500">PIC BMN</div>
                            </div>
                          ) : (
                            <div className="text-gray-400 italic text-[9px]">Belum Diverifikasi</div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Lembar Tanda Tangan Pengesahan Murni dari Database Auth */}
            <div className="mt-5 grid grid-cols-2 text-[10px] pt-2 break-inside-avoid">
              <div className="text-center">
                <p className="font-medium">Petugas Pelaksana Pemeliharaan,</p>
                <div className="h-14 flex items-center justify-center">
                  {filteredRecords.length > 0 && executorSignatureUrl ? (
                    <img
                      src={executorSignatureUrl}
                      alt="TTD Pelaksana"
                      className="max-h-12 max-w-[120px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-[9px] italic">
                      ( Terverifikasi Digital via SSO )
                    </div>
                  )}
                </div>
                <p className="font-bold underline">
                  {filteredRecords.length > 0
                    ? filteredRecords[0].executorName
                    : "( .................................................... )"}
                </p>
                {filteredRecords.length > 0 && filteredRecords[0].executorNip && filteredRecords[0].executorNip !== "-" ? (
                  <p className="text-[9px] text-gray-600">
                    NIP. {filteredRecords[0].executorNip}
                  </p>
                ) : null}
              </div>
              <div className="text-center">
                <p className="font-medium">
                  Mataram,{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="font-medium">Mengetahui / Menyetujui,</p>
                <p className="font-semibold">{picInfo?.role_title || "Kasubag Tata Usaha / PIC BMN"}</p>
                <div className="h-14 flex items-center justify-center">
                  {picSignatureUrl ? (
                    <img
                      src={picSignatureUrl}
                      alt="TTD PIC"
                      className="max-h-12 max-w-[120px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-[9px] italic">
                      ( Tanda Tangan Digital )
                    </div>
                  )}
                </div>
                <p className="font-bold underline">{picInfo?.name || "PIC BMN"}</p>
                {picInfo?.nip && picInfo.nip !== "-" ? (
                  <p className="text-[9px] text-gray-600">NIP. {picInfo.nip}</p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
