"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

// Tipe Data Log Pemeliharaan
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
  activityTitle: string;
  activityDetails?: string; // Uraian detail kegiatan yang diisi petugas
  executorName: string; // Pelaksana (diambil dari akun SSO login)
  executorRole?: string;
  executorNip?: string;
  verifierName: string; // Pemeriksa (Anas / Kasubag TU)
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
  startTime: string; // HH:mm:ss
  startTimeDisplay: string;
  startTimestamp: number;
  activityType: MaintenanceRecord["activityType"];
  activityTitle: string;
  activityDetails: string; // Uraian detail yang diisi saat check-in
  executorName: string;
  executorRole: string;
  executorNip: string;
  initialPhotoUrl?: string;
}

// User Profile Simulasi SSO BPOM
export interface AuthUser {
  name: string;
  role: string;
  nip: string;
  email: string;
  isPic?: boolean;
}

// Data Awal Riil Berdasarkan Lembar Kendali Fisik BMN BPOM
const INITIAL_RECORDS: MaintenanceRecord[] = [
  {
    id: 12,
    date: "2026-07-02",
    startTime: "11:10",
    endTime: "11:25",
    durationMinutes: 15,
    activityType: "fuel_refill",
    activityTitle: "Panasin genset dan tambah solar",
    activityDetails: "Pemanasan rutin mingguan serta pengisian bahan bakar solar pada tangki harian.",
    executorName: "Ahmad",
    executorRole: "Teknisi Sarpras",
    executorNip: "19880512 201201 1 002",
    verifierName: "Anas",
    isVerified: true,
    verifiedAt: "2026-07-02 12:00",
    statusAfter: "standby",
    notes: "Pemanasan 15 menit berjalan normal, penambahan 40 liter solar industri ke tangki harian.",
    initialPhotoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    finalPhotoUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 11,
    date: "2026-06-22",
    startTime: "09:45",
    endTime: "09:55",
    durationMinutes: 10,
    activityType: "warming_up",
    activityTitle: "Panasin genset",
    activityDetails: "Pemanasan berkala 10 menit tanpa beban gedung.",
    executorName: "Irfan",
    executorRole: "Teknisi Sarpras",
    executorNip: "19920315 201503 1 004",
    verifierName: "Anas",
    isVerified: true,
    verifiedAt: "2026-06-22 10:15",
    statusAfter: "standby",
    notes: "Pemanasan 10 menit, suara mesin normal tidak ada anomali.",
    initialPhotoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 10,
    date: "2026-06-13",
    startTime: "09:30",
    endTime: "09:50",
    durationMinutes: 20,
    activityType: "warming_up",
    activityTitle: "Panasin genset",
    activityDetails: "Pemanasan mingguan mesin genset.",
    executorName: "Yudi",
    executorRole: "Teknisi Sarpras",
    executorNip: "19900820 201402 1 003",
    verifierName: "Anas",
    isVerified: true,
    verifiedAt: "2026-06-13 10:00",
    statusAfter: "standby",
    notes: "Pemanasan rutin 20 menit, pembuangan asap normal.",
  },
  {
    id: 9,
    date: "2026-06-06",
    startTime: "10:10",
    endTime: "10:25",
    durationMinutes: 15,
    activityType: "warming_up",
    activityTitle: "Panasin genset",
    activityDetails: "Pemanasan rutin mingguan.",
    executorName: "Irfan",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    verifiedAt: "2026-06-06 10:40",
    statusAfter: "standby",
    notes: "Pemanasan rutin 15 menit, indikator kelistrikan stabil.",
  },
  {
    id: 8,
    date: "2026-05-24",
    startTime: "09:10",
    endTime: "09:30",
    durationMinutes: 20,
    activityType: "fuel_refill",
    activityTitle: "Panasin genset dan pengisian solar",
    activityDetails: "Pemanasan 20 menit dan pengisian solar industri.",
    executorName: "Ahmad",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    verifiedAt: "2026-05-24 10:00",
    statusAfter: "standby",
    notes: "Pemanasan 20 menit serta pengisian 60 liter solar ke tangki harian.",
    initialPhotoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    finalPhotoUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 7,
    date: "2026-05-17",
    startTime: "17:36",
    endTime: "17:50",
    durationMinutes: 14,
    activityType: "warming_up",
    activityTitle: "Panasin genset",
    activityDetails: "Pemanasan berkala sore hari.",
    executorName: "Ahmad",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    statusAfter: "standby",
    notes: "Pemanasan rutin mingguan 14 menit.",
  },
  {
    id: 6,
    date: "2026-05-11",
    startTime: "18:12",
    endTime: "19:06",
    durationMinutes: 54,
    activityType: "emergency_run",
    activityTitle: "Mati lampu PLN (Pengoperasian Darurat)",
    activityDetails: "PLN area perkantoran padam total. Genset start otomatis dan memasok daya gedung laboratorium pengujian dan ruang server.",
    executorName: "Irfan",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    statusAfter: "standby",
    notes: "PLN padam mendadak 54 menit. Genset memikul beban listrik gedung dengan stabil pada tegangan 380V / 50 Hz.",
    initialPhotoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    finalPhotoUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    date: "2026-05-09",
    startTime: "09:00",
    endTime: "09:20",
    durationMinutes: 20,
    activityType: "warming_up",
    activityTitle: "Hidupkan genset (Pemanasan Rutin)",
    activityDetails: "Pemanasan mingguan mesin genset.",
    executorName: "Yudi",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    statusAfter: "standby",
    notes: "Pemanasan 20 menit, pembuangan asap normal tidak ada getaran abnormal.",
  },
  {
    id: 4,
    date: "2026-05-03",
    startTime: "16:57",
    endTime: "17:03",
    durationMinutes: 6,
    activityType: "warming_up",
    activityTitle: "Hidupkan genset (Pemanasan Rutin)",
    activityDetails: "Pemanasan singkat 6 menit.",
    executorName: "Ahmad",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    statusAfter: "standby",
    notes: "Pemanasan berkala sore hari selama 6 menit.",
  },
  {
    id: 3,
    date: "2026-04-25",
    startTime: "09:57",
    endTime: "10:15",
    durationMinutes: 18,
    activityType: "warming_up",
    activityTitle: "Hidupkan genset (Pemanasan Rutin)",
    activityDetails: "Pemanasan mingguan.",
    executorName: "Irfan",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    statusAfter: "standby",
    notes: "Pemanasan 18 menit berjalan lancar.",
  },
  {
    id: 2,
    date: "2026-04-18",
    startTime: "09:05",
    endTime: "09:18",
    durationMinutes: 13,
    activityType: "routine_service",
    activityTitle: "Pengecekan fisik: air radiator, solar, oli mesin dan aki",
    activityDetails: "Pemeriksaan menyeluruh sebelum pemanasan: volume air radiator, level oli stik, tegangan terminal aki, dan sisa volume solar tangki.",
    executorName: "Ahmad",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    statusAfter: "standby",
    notes: "Air radiator penuh, volume solar cukup (~85%), tegangan aki 12.8V prima.",
    initialPhotoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 1,
    date: "2026-04-11",
    startTime: "08:32",
    endTime: "08:45",
    durationMinutes: 13,
    activityType: "warming_up",
    activityTitle: "Hidupkan genset (Pemanasan Rutin)",
    activityDetails: "Pemanasan mingguan rutin.",
    executorName: "Ahmad",
    executorRole: "Teknisi Sarpras",
    verifierName: "Anas",
    isVerified: true,
    statusAfter: "standby",
    notes: "Pemanasan mingguan 13 menit. Suara mesin normal, tanpa beban listrik.",
    initialPhotoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    finalPhotoUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
  },
];

export default function RiwayatPemeliharaanMain() {
  // State Data Log Pemeliharaan
  const [records, setRecords] = useState<MaintenanceRecord[]>(INITIAL_RECORDS);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");

  // State Autentikasi Petugas (Simulasi SSO Akun BPOM)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInputNip, setLoginInputNip] = useState("");
  const [loginInputPass, setLoginInputPass] = useState("");

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

  // State Form Langkah 1: Check-in (Mulai Kegiatan)
  // Catatan: Waktu mulai terisi otomatis saat form dibuka. Uraian dikosongkan secara default untuk diisi petugas.
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
  const [checkInDetails, setCheckInDetails] = useState(""); // KOSONG SECARA DEFAULT
  const [checkInPhotoUrl, setCheckInPhotoUrl] = useState<string>("");

  // State Form Langkah 2: Check-out (Selesaikan Kegiatan)
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
  const [checkOutNotes, setCheckOutNotes] = useState(""); // Catatan hasil pemeriksaan
  const [checkOutPhotoUrl, setCheckOutPhotoUrl] = useState<string>("");

  // Helper Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

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
    const interval = setInterval(updateElapsed, 15000); // per 15 detik
    return () => clearInterval(interval);
  }, [activeSession]);

  // Handler Buka Form Check-in (Memeriksa Login Terlebih Dahulu)
  const handleInitiateNewActivity = () => {
    if (activeSession) {
      showToast("⚠️ Ada kegiatan pemeliharaan yang sedang berjalan! Selesaikan kegiatan tersebut terlebih dahulu.");
      return;
    }

    if (!currentUser) {
      // Petugas belum login -> Tampilkan modal login SSO
      setIsLoginModalOpen(true);
      return;
    }

    // Petugas sudah login -> Buka form Check-in dengan capture waktu otomatis saat ini
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
    const displayStr = now.toLocaleDateString("id-ID", {
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

    // Reset uraian detail menjadi KOSONG sesuai arahan user
    setCheckInActivityType("warming_up");
    setCheckInCustomType("");
    setCheckInDetails("");
    setCheckInPhotoUrl("");
    setIsCheckInModalOpen(true);
  };

  // Login Cepat Simulasi Petugas
  const handleQuickLogin = (role: "teknisi" | "pic") => {
    if (role === "teknisi") {
      setCurrentUser({
        name: "Ahmad",
        role: "Teknisi Sarpras",
        nip: "19880512 201201 1 002",
        email: "ahmad.sarpras@pom.go.id",
        isPic: false,
      });
      setIsLoginModalOpen(false);
      showToast("✓ Berhasil login sebagai Ahmad (Teknisi Sarpras - Pelaksana).");
      // Langsung buka modal check-in setelah login
      setTimeout(() => {
        openCheckInModal();
      }, 300);
    } else {
      setCurrentUser({
        name: "Anas",
        role: "PIC Sarpras (Kasubag TU)",
        nip: "19790410 200501 1 003",
        email: "anas.tu@pom.go.id",
        isPic: true,
      });
      setIsLoginModalOpen(false);
      showToast("✓ Berhasil login sebagai Anas (PIC Sarpras). Anda berwenang menekan tombol centang persetujuan di kolom AKSI.");
    }
  };

  // Login Manual NIP
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({
      name: loginInputNip.trim() || "Petugas BMN",
      role: "Teknisi Sarpras",
      nip: loginInputNip.trim() || "19880512 201201 1 002",
      email: "petugas@pom.go.id",
    });
    setIsLoginModalOpen(false);
    showToast(`✓ Berhasil login akun petugas.`);
    setTimeout(() => {
      openCheckInModal();
    }, 300);
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    showToast("Anda telah keluar dari akun petugas.");
  };

  // Submit Langkah 1: Check-in (Mulai Kegiatan)
  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();

    let activityTitle = "Pemanasan Rutin (Panasin Genset)";
    if (checkInActivityType === "emergency_run") activityTitle = "Pengoperasian Beban Darurat (Mati Lampu PLN)";
    if (checkInActivityType === "routine_service") activityTitle = "Servis Berkala / Pengecekan Fisik";
    if (checkInActivityType === "fuel_refill") activityTitle = "Pengisian Bahan Bakar (BBM Solar)";
    if (checkInActivityType === "load_test") activityTitle = "Uji Beban Listrik (Load Test)";
    if (checkInActivityType === "repair") activityTitle = "Perbaikan / Troubleshooting";
    if (checkInActivityType === "other") activityTitle = checkInCustomType || "Kegiatan Khusus Genset";

    const newActiveSession: ActiveMaintenanceSession = {
      id: Date.now(),
      date: checkInTimeCaptured.dateStr,
      startTime: checkInTimeCaptured.timeStr,
      startTimeDisplay: checkInTimeCaptured.displayStr,
      startTimestamp: checkInTimeCaptured.timestamp || Date.now(),
      activityType: checkInActivityType,
      activityTitle,
      activityDetails: checkInDetails.trim(),
      executorName: currentUser?.name || "Ahmad",
      executorRole: currentUser?.role || "Teknisi Sarpras",
      executorNip: currentUser?.nip || "19880512 201201 1 002",
      initialPhotoUrl: checkInPhotoUrl || undefined,
    };

    setActiveSession(newActiveSession);
    setIsCheckInModalOpen(false);
    showToast(`⚡ Kegiatan dimulai! Status genset kini '${getActivityDynamicStatus(checkInActivityType)}'.`);
  };

  // Buka Modal Langkah 2: Check-out (Selesaikan Kegiatan)
  const openCheckOutModal = () => {
    if (!activeSession) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    const secs = String(now.getSeconds()).padStart(2, "0");

    const timeStr = `${hours}:${mins}`;
    const displayStr = now.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + `, Pukul ${hours}:${mins}:${secs} WITA`;

    // Hitung durasi otomatis dari waktu mulai sampai sekarang
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
  const handleSubmitCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const completedRecord: MaintenanceRecord = {
      id: activeSession.id,
      date: activeSession.date,
      startTime: activeSession.startTime,
      endTime: checkOutTimeCaptured.timeStr,
      durationMinutes: checkOutTimeCaptured.duration,
      activityType: activeSession.activityType,
      activityTitle: activeSession.activityTitle,
      activityDetails: activeSession.activityDetails,
      executorName: activeSession.executorName,
      executorRole: activeSession.executorRole,
      executorNip: activeSession.executorNip,
      verifierName: "Anas",
      isVerified: false, // Menunggu paraf Kasubag TU / Pemeriksa
      statusAfter: checkOutStatusAfter,
      notes: checkOutNotes.trim() || undefined,
      initialPhotoUrl: activeSession.initialPhotoUrl,
      finalPhotoUrl: checkOutPhotoUrl || undefined,
    };

    // Tambahkan record baru ke posisi paling atas tabel riwayat
    setRecords([completedRecord, ...records]);
    setActiveSession(null);
    setIsCheckOutModalOpen(false);
    showToast("✓ Kegiatan pemeliharaan berhasil diselesaikan dan dicatat ke riwayat!");
  };

  // Batalkan Sesi Berjalan (Jika Salah Tekan Mulai)
  const handleCancelActiveSession = () => {
    if (confirm("Apakah Anda yakin ingin membatalkan sesi kegiatan yang sedang berjalan ini?")) {
      setActiveSession(null);
      showToast("Sesi kegiatan dibatalkan. Genset kembali ke status Siaga.");
    }
  };

  // Verifikasi / Persetujuan Digital oleh Akun PIC
  const handleVerify = (id: number) => {
    const picName = currentUser?.isPic ? currentUser.name : "Anas (PIC)";
    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              isVerified: true,
              verifierName: picName,
              verifiedAt: new Date().toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            }
          : rec
      )
    );
    showToast(`✓ Log kegiatan berhasil diverifikasi & disetujui oleh PIC (${picName}).`);
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
      const matchSearch =
        r.activityTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.executorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.activityDetails || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchMonth =
        selectedMonth === "all" || r.date.startsWith(`2026-${selectedMonth}`);

      return matchSearch && matchMonth;
    });
  }, [records, searchQuery, selectedMonth]);

  // Record terakhir untuk ringkasan catatan operasional
  const latestRecord = records[0];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 font-sans text-slate-800">
      {/* 1. Header Bar: Bersih, Rapi & Navigatif */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              title="Kembali ke Beranda"
            >
              <Icon icon="solar:arrow-left-linear" width={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  POM-14.01/CFM.01/SOP.01
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-400">BMN & Sarana Prasarana</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Riwayat Pemeliharaan Genset
              </h1>
            </div>
          </div>

          {/* Area Aksi Kanan & Identitas Akun Petugas */}
          <div className="flex items-center gap-2">
            {/* Status Akun Petugas */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-2.5 py-1 text-xs">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-white font-bold text-[10px] ${
                    currentUser.isPic ? "bg-emerald-600" : "bg-[#005baa]"
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </span>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 block leading-tight">
                      {currentUser.name}
                    </span>
                    {currentUser.isPic && (
                      <span className="rounded bg-emerald-100 px-1 py-0.5 text-[9px] font-extrabold text-emerald-800 border border-emerald-300">
                        PIC
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-blue-700 block leading-tight">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 text-[11px] text-slate-400 hover:text-rose-600 font-medium"
                  title="Keluar Akun"
                >
                  <Icon icon="solar:logout-2-linear" width={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <Icon icon="solar:user-bold" width={14} className="text-slate-500" />
                <span>Login Petugas</span>
              </button>
            )}

            {/* Tombol Stiker Barcode QR */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
              title="Buka stiker QR barcode siap tempel di fisik genset"
            >
              <Icon icon="solar:qr-code-bold" width={15} className="text-[#005baa]" />
              <span className="hidden lg:inline">Stiker QR</span>
            </button>

            {/* Tombol Cetak Form */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
              title="Cetak lembar riwayat"
            >
              <Icon icon="solar:printer-bold" width={15} className="text-slate-500" />
              <span className="hidden lg:inline">Cetak</span>
            </button>

            {/* Tombol Utama: Catat Kegiatan Baru */}
            <button
              type="button"
              onClick={handleInitiateNewActivity}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition active:scale-95 ${
                activeSession
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[#005baa] hover:bg-[#004885]"
              }`}
            >
              <Icon icon={activeSession ? "solar:hourglass-bold" : "solar:pen-bold"} width={14} />
              <span>{activeSession ? "Kegiatan Berjalan..." : "+ Catat Kegiatan Baru"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Konten Halaman */}
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-4">
        {/* Toast Notifikasi Dinamis */}
        {toastMessage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-[#005baa] shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <Icon icon="solar:info-circle-bold" width={16} />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-blue-400 hover:text-blue-700"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          </div>
        )}

        {/* 2. HERO HIGHLIGHT: KARTU IDENTITAS & STATUS GENSET (Sesuai Konsep Quick-View) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#072448] via-[#0b3c68] to-[#005baa] p-5 sm:p-6 text-white shadow-md">
          {/* Background Decorative Pattern */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="pointer-events-none absolute right-24 bottom-0 h-40 w-40 rounded-full bg-sky-300/10 blur-xl" />

          {/* Baris Atas: Status Kesiapan Aset */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              {activeSession ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-200 border border-amber-300/40 backdrop-blur-xs">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  Kondisi Aset: {getActivityDynamicStatus(activeSession.activityType)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-300/30 backdrop-blur-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Kondisi Aset: Siaga (Standby - Siap Digunakan)
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-sky-200/80">
              KODE BMN: BMN-GEN-01 &bull; 100 kVA
            </span>
          </div>

          {/* Baris Tengah: Judul Genset & 3 Metrik Cepat */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-white/15">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                GENSET — WILSON 100 KVA
              </h2>
              <p className="text-xs sm:text-sm text-sky-100/90 mt-1 max-w-2xl leading-relaxed">
                Gedung Belakang &bull; Rumah Genset BBPOM di Mataram (Penunjang Utama Listrik Laboratorium Pengujian, Cold Storage & Server)
              </p>
            </div>

            {/* 3 Box Metrik Kesiapan Operasional */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div className="rounded-xl bg-white/10 p-2.5 sm:p-3 text-center border border-white/10 backdrop-blur-xs">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-sky-200/80">
                  TIPE / MERK
                </span>
                <span className="font-bold text-xs sm:text-sm text-white mt-0.5 block">
                  WILSON 100 KVA
                </span>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 sm:p-3 text-center border border-white/10 backdrop-blur-xs">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-sky-200/80">
                  STATUS PEMANASAN
                </span>
                <span className="font-bold text-xs sm:text-sm text-emerald-300 mt-0.5 block">
                  Tepat Waktu
                </span>
              </div>
              <div className="rounded-xl bg-white/10 p-2.5 sm:p-3 text-center border border-white/10 backdrop-blur-xs">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-sky-200/80">
                  LEVEL SOLAR
                </span>
                <span className="font-bold text-xs sm:text-sm text-amber-300 mt-0.5 block">
                  ~85% (Aman)
                </span>
              </div>
            </div>
          </div>

          {/* Baris Bawah: Catatan Operasional Terakhir & Kepatuhan Mingguan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 text-xs text-sky-100/90">
            <div className="flex items-center gap-2">
              <Icon icon="solar:info-circle-bold" width={15} className="text-amber-300 shrink-0" />
              <span>
                <strong>Catatan Operasional:</strong> Genset terakhir dipanaskan pada{" "}
                {latestRecord ? formatDateDisplay(latestRecord.date) : "02-07-2026"} (oleh{" "}
                {latestRecord ? latestRecord.executorName : "Ahmad"}) selama{" "}
                {latestRecord ? latestRecord.durationMinutes : 15} menit.
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300 self-start sm:self-auto shrink-0">
              <Icon icon="solar:check-circle-bold" width={14} />
              <span>Kepatuhan Pemanasan Mingguan: Normal</span>
            </div>
          </div>
        </div>

        {/* 3. BANNER KEGIATAN SEDANG BERLANGSUNG (ACTIVE RUNNING SESSION) */}
        {activeSession && (
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 p-4 sm:p-5 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                  <Icon icon="solar:hourglass-bold" width={22} className="animate-spin text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-md bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Kegiatan Sedang Berlangsung
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-900">
                      ⏱️ Berjalan: {runningMinutes} Menit
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                    {activeSession.activityTitle}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5 flex-wrap">
                    <span>
                      Pelaksana: <strong>{activeSession.executorName}</strong> ({activeSession.executorRole})
                    </span>
                    <span>&bull;</span>
                    <span>
                      Check-in Mulai: <strong>{activeSession.startTime} WITA</strong>
                    </span>
                  </div>
                  {activeSession.activityDetails && (
                    <p className="mt-2 text-xs text-amber-900 bg-white/80 p-2 rounded-lg border border-amber-200/80 leading-relaxed">
                      <strong>Uraian Kegiatan:</strong> {activeSession.activityDetails}
                    </p>
                  )}
                </div>
              </div>

              {/* Tombol Aksi Check-out */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleCancelActiveSession}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  title="Batalkan sesi ini jika salah tekan"
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  onClick={openCheckOutModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95"
                >
                  <Icon icon="solar:check-circle-bold" width={16} />
                  <span>Selesaikan Kegiatan (Check-out)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. TOOLBAR KONTROL: PENCARIAN, FILTER BULAN & TOGGLE MODE */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Input Pencarian */}
            <div className="relative">
              <Icon
                icon="solar:magnifer-linear"
                width={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari kegiatan, nama pelaksana, keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 sm:w-72 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#005baa] focus:outline-none focus:ring-1 focus:ring-[#005baa] shadow-2xs"
              />
            </div>

            {/* Filter Bulan */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-[#005baa] focus:outline-none shadow-2xs"
            >
              <option value="all">Semua Bulan (2026)</option>
              <option value="04">April 2026 (3 kegiatan)</option>
              <option value="05">Mei 2026 (5 kegiatan)</option>
              <option value="06">Juni 2026 (3 kegiatan)</option>
              <option value="07">Juli 2026 (1 kegiatan)</option>
              <option value="11">November 2026 (Bulan Berjalan)</option>
            </select>
          </div>

          {/* Toggle Tampilan (Tabel Formulir Asli vs Kartu Modern) */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon icon="solar:document-text-bold" width={14} />
              <span>Formulir Asli (Tabel)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "cards"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon icon="solar:gallery-bold" width={14} />
              <span>Kartu Modern</span>
            </button>
          </div>
        </div>

        {/* 5. TABEL RIWAYAT PEMERIKSAAN (FORMAT FORMULIR ASLI SESUAI REFERENSI DOKUMEN MANUAL BPOM) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="px-3 py-3 w-12 text-center">NO</th>
                    <th className="px-4 py-3 w-32">TANGGAL</th>
                    <th className="px-4 py-3 min-w-[280px]">AKTIFITAS & WAKTU</th>
                    <th className="px-4 py-3 w-40 text-center">PELAKSANA (NAMA & TTD)</th>
                    <th className="px-4 py-3 min-w-[200px]">KETERANGAN</th>
                    <th className="px-3 py-3 w-28 text-center">FOTO BUKTI</th>
                    <th className="px-3.5 py-3 w-36 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Tidak ada riwayat aktivitas pemeliharaan yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((item, idx) => {
                      const typeBadge = getActivityBadge(item.activityType);
                      const isEmergency = item.activityType === "emergency_run";

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isEmergency ? "bg-rose-50/20" : ""
                          }`}
                        >
                          {/* 1. NO */}
                          <td className="px-3 py-3.5 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>

                          {/* 2. TANGGAL */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 block font-mono">
                              {formatDateDisplay(item.date)}
                            </span>
                          </td>

                          {/* 3. AKTIFITAS & WAKTU */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${typeBadge.color}`}>
                                  {typeBadge.label}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 font-medium">
                                  {item.startTime} - {item.endTime} ({item.durationMinutes} menit)
                                </span>
                              </div>
                              <p className="font-semibold text-slate-900 leading-snug">
                                {item.activityTitle}
                              </p>
                              {item.activityDetails && (
                                <p className="text-[11px] text-slate-500 italic">
                                  {item.activityDetails}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* 4. PELAKSANA (NAMA & TTD) */}
                          <td className="px-4 py-3.5 text-center">
                            <div className="inline-block text-center">
                              <span className="font-bold text-slate-900 block">
                                {item.executorName}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {item.executorRole || "Teknisi"}
                              </span>
                              <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-200">
                                <Icon icon="solar:check-circle-bold" width={10} />
                                TTD Valid (SSO)
                              </span>
                            </div>
                          </td>

                          {/* 5. KETERANGAN */}
                          <td className="px-4 py-3.5 text-slate-600 text-xs">
                            {item.notes ? (
                              <p className="line-clamp-2 leading-relaxed">{item.notes}</p>
                            ) : (
                              <span className="text-slate-300 italic">-</span>
                            )}
                          </td>

                          {/* 6. FOTO BUKTI */}
                          <td className="px-3 py-3.5 text-center">
                            {item.initialPhotoUrl || item.finalPhotoUrl ? (
                              <div className="flex items-center justify-center gap-1">
                                {item.initialPhotoUrl && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewPhoto({
                                        url: item.initialPhotoUrl!,
                                        caption: `Foto Awal: ${item.activityTitle} (${item.date})`,
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
                                        caption: `Foto Akhir: ${item.activityTitle} (${item.date})`,
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

                          {/* 7. AKSI (TOMBOL CENTANG VERIFIKASI PIC) */}
                          <td className="px-3.5 py-3.5 text-center">
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
                                onClick={() => handleVerify(item.id)}
                                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition"
                                title="Klik centang untuk menyetujui & verifikasi data ini sebagai PIC"
                              >
                                <Icon icon="solar:check-circle-bold" width={15} />
                                <span>Centang Setujui</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!currentUser) {
                                    setIsLoginModalOpen(true);
                                    showToast("Silakan login sebagai akun PIC untuk menyetujui data ini.");
                                  } else {
                                    showToast("⚠️ Akun saat ini bukan PIC. Hanya PIC yang dapat menekan centang persetujuan.");
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
          ) : (
            /* Mode Tampilan Kartu Responsif */
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map((item) => {
                const typeBadge = getActivityBadge(item.activityType);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold border ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 font-mono">
                          {formatDateDisplay(item.date)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm mb-1">
                        {item.activityTitle}
                      </h3>

                      <span className="text-xs text-slate-500 font-mono block mb-2">
                        {item.startTime} - {item.endTime} ({item.durationMinutes} menit)
                      </span>

                      {item.activityDetails && (
                        <p className="text-xs text-slate-500 italic mb-2">
                          {item.activityDetails}
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                          <strong>Keterangan:</strong> {item.notes}
                        </p>
                      )}

                      {/* Foto Bukti */}
                      {(item.initialPhotoUrl || item.finalPhotoUrl) && (
                        <div className="mb-3">
                          <span className="text-[10px] font-medium text-slate-400 block mb-1">
                            Foto Bukti Panel:
                          </span>
                          <div className="flex gap-2">
                            {item.initialPhotoUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewPhoto({
                                    url: item.initialPhotoUrl!,
                                    caption: `Foto Awal: ${item.activityTitle}`,
                                  })
                                }
                                className="group relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                              >
                                <img
                                  src={item.initialPhotoUrl}
                                  alt="Awal"
                                  className="h-full w-full object-cover group-hover:scale-105 transition"
                                />
                                <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[8px] text-white text-center">
                                  Awal
                                </span>
                              </button>
                            )}
                            {item.finalPhotoUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewPhoto({
                                    url: item.finalPhotoUrl!,
                                    caption: `Foto Akhir: ${item.activityTitle}`,
                                  })
                                }
                                className="group relative h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                              >
                                <img
                                  src={item.finalPhotoUrl}
                                  alt="Akhir"
                                  className="h-full w-full object-cover group-hover:scale-105 transition"
                                />
                                <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[8px] text-white text-center">
                                  Akhir
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pelaksana</span>
                        <span className="font-semibold text-slate-800">{item.executorName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Aksi PIC</span>
                        {item.isVerified ? (
                          <span className="font-bold text-emerald-700 text-xs inline-flex items-center gap-1">
                            <Icon icon="solar:check-circle-bold" width={13} />
                            Disetujui PIC
                          </span>
                        ) : currentUser?.isPic ? (
                          <button
                            type="button"
                            onClick={() => handleVerify(item.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-lg hover:bg-emerald-700 shadow-2xs transition"
                          >
                            <Icon icon="solar:check-circle-bold" width={13} />
                            <span>Centang</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Menunggu PIC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Card */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              Menampilkan <strong>{filteredRecords.length}</strong> dari <strong>{records.length}</strong> catatan pemeliharaan Genset WILSON 100 kVA.
            </span>
            <span className="text-slate-400">
              Formulir Kendali Sarpras BMN &bull; BBPOM di Mataram
            </span>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 6. MODAL AUTENTIKASI PETUGAS (SSO BPOM) */}
      {/* ========================================================================= */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#005baa] border border-blue-200">
                  <Icon icon="solar:lock-keyhole-bold" width={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Autentikasi Petugas Pemeliharaan
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Sistem Single Sign-On (SSO) BBPOM di Mataram
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Pencatatan kegiatan operasional dan pemeliharaan genset memerlukan identitas akun petugas yang bertanggung jawab. Silakan login untuk memulai kegiatan:
              </p>

              {/* Pilihan 1: Masuk Cepat Simulasi (1-Klik Testing) */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2">
                <span className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider text-[#005baa]">
                  Akses Cepat (Simulasi Testing):
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("teknisi")}
                    className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-blue-200 text-left hover:border-[#005baa] hover:bg-blue-50/50 shadow-2xs transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">Ahmad</span>
                      <span className="text-[11px] text-slate-500">Teknisi Sarpras &bull; Pelaksana Kegiatan</span>
                    </div>
                    <span className="rounded-lg bg-[#005baa] px-2.5 py-1 text-[10px] font-bold text-white">
                      Pilih & Lanjut &rarr;
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("pic")}
                    className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-emerald-200 text-left hover:border-emerald-500 hover:bg-emerald-50/50 shadow-2xs transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 block">Anas</span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800 border border-emerald-300">
                          PIC Sarpras
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">Kasubag Tata Usaha &bull; Berwenang Centang Verifikasi</span>
                    </div>
                    <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">
                      Login Sebagai PIC &rarr;
                    </span>
                  </button>
                </div>
              </div>

              {/* Pilihan 2: Form Login NIP */}
              <form onSubmit={handleManualLogin} className="space-y-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP / Nama Petugas
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 19880512 201201 1 002"
                    value={loginInputNip}
                    onChange={(e) => setLoginInputNip(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi SSO
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={loginInputPass}
                    onChange={(e) => setLoginInputPass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#005baa] py-2.5 font-bold text-white shadow-2xs hover:bg-[#004885] transition"
                >
                  Masuk Akun SSO & Mulai Check-in
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL LANGKAH 1: CHECK-IN (MULAI KEGIATAN) */}
      {/* Sesuai Arahan: Tanggal & Waktu Mulai Otomatis, Tanpa Waktu Selesai, Tanpa Kondisi Akhir, Uraian Kosong */}
      {/* ========================================================================= */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#005baa] uppercase tracking-wider">
                  Langkah 1: Check-in (Mulai Kegiatan)
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  Mulai Pemeliharaan Genset WILSON 100 kVA
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

            <form onSubmit={handleSubmitCheckIn} className="p-5 space-y-4 text-xs">
              {/* Info Waktu Mulai Otomatis (Read-only) */}
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
                  Petugas Pelaksana (Akun Terverifikasi)
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700 font-semibold">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:user-bold" width={14} className="text-[#005baa]" />
                    <span>{currentUser?.name || "Ahmad"} ({currentUser?.role || "Teknisi Sarpras"})</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                    SSO Aktif
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

              {/* Jika Jenis Kegiatan = Lainnya */}
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

              {/* Detail / Uraian Kegiatan (KOSONG SECARA DEFAULT UNTUK DIISI PETUGAS) */}
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

              {/* Upload Foto Bukti Awal (Panel Kontrol / Kondisi Awal Genset) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto Bukti Awal (Panel Instrumen / Kondisi Sebelum Dinyalakan)
                </label>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center">
                  {checkInPhotoUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={checkInPhotoUrl}
                        alt="Foto Bukti Awal"
                        className="h-24 w-auto rounded-lg object-cover mx-auto border border-slate-200 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setCheckInPhotoUrl("")}
                        className="absolute -top-2 -right-2 rounded-full bg-rose-600 text-white p-0.5"
                      >
                        <Icon icon="solar:close-circle-bold" width={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Icon icon="solar:camera-bold" width={22} className="mx-auto text-slate-400" />
                      <span className="block font-semibold text-slate-700 text-xs">
                        Ambil Foto Panel Kontrol Awal
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Dokumentasikan display jarum voltase atau hour meter sebelum mulai
                      </span>
                      {/* Tombol Simulasi Foto Cepat */}
                      <div className="flex justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCheckInPhotoUrl(
                              "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
                            )
                          }
                          className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#005baa] hover:bg-blue-100"
                        >
                          + Pasang Contoh Foto Panel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Aksi Check-in */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#005baa] px-5 py-2 font-bold text-white shadow-2xs hover:bg-[#004885] active:scale-95 transition"
                >
                  Mulai Kegiatan (Check-in) &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL LANGKAH 2: CHECK-OUT (SELESAIKAN KEGIATAN) */}
      {/* Sesuai Arahan: Waktu Selesai & Durasi Otomatis, Kondisi Akhir, Catatan Hasil, Foto Akhir */}
      {/* ========================================================================= */}
      {isCheckOutModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Langkah 2: Check-out (Selesaikan Kegiatan)
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  Selesaikan & Simpan Riwayat Pemeliharaan
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

            <form onSubmit={handleSubmitCheckOut} className="p-5 space-y-4 text-xs">
              {/* Ringkasan Kegiatan Yang Selesai */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    JENIS KEGIATAN:
                  </span>
                  <span className="font-bold text-slate-900">{activeSession.activityTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Pelaksana:</span>
                  <span className="font-semibold text-slate-800">{activeSession.executorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Waktu Mulai (Check-in):</span>
                  <span className="font-mono font-semibold text-slate-800">{activeSession.startTime} WITA</span>
                </div>
              </div>

              {/* Waktu Selesai & Durasi Terhitung Otomatis */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                    WAKTU SELESAI
                  </span>
                  <span className="text-sm font-bold text-emerald-950 font-mono">
                    {checkOutTimeCaptured.timeStr} WITA
                  </span>
                  <span className="block text-[10px] text-emerald-700 mt-0.5">
                    Tercatat otomatis
                  </span>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
                  <span className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">
                    DURASI TOTAL
                  </span>
                  <span className="text-sm font-bold text-blue-950 font-mono">
                    {checkOutTimeCaptured.duration} Menit
                  </span>
                  <span className="block text-[10px] text-blue-700 mt-0.5">
                    Dihitung otomatis
                  </span>
                </div>
              </div>

              {/* Kondisi Aset Akhir */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kondisi Aset Akhir Setelah Kegiatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={checkOutStatusAfter}
                  onChange={(e) =>
                    setCheckOutStatusAfter(e.target.value as MaintenanceRecord["statusAfter"])
                  }
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

              {/* Upload Foto Bukti Akhir (Panel Selesai / Fisik Akhir) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto Bukti Akhir (Panel Operasional / Hasil Pemeliharaan)
                </label>
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center">
                  {checkOutPhotoUrl ? (
                    <div className="relative inline-block">
                      <img
                        src={checkOutPhotoUrl}
                        alt="Foto Bukti Akhir"
                        className="h-24 w-auto rounded-lg object-cover mx-auto border border-slate-200 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setCheckOutPhotoUrl("")}
                        className="absolute -top-2 -right-2 rounded-full bg-rose-600 text-white p-0.5"
                      >
                        <Icon icon="solar:close-circle-bold" width={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Icon icon="solar:camera-bold" width={22} className="mx-auto text-slate-400" />
                      <span className="block font-semibold text-slate-700 text-xs">
                        Ambil Foto Panel Kontrol Akhir
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Foto display jam operasi (hour meter) atau kondisi akhir mesin
                      </span>
                      {/* Tombol Simulasi Foto Cepat */}
                      <div className="flex justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCheckOutPhotoUrl(
                              "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80"
                            )
                          }
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          + Pasang Contoh Foto Akhir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tombol Form Check-out */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckOutModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition"
                >
                  Simpan & Selesaikan Kegiatan (Check-out)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: STIKER BARCODE QR FISIK SIAP CETAK & TESTING */}
      {/* ========================================================================= */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl text-center p-6 animate-in fade-in zoom-in-95 duration-150">
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
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                BBPOM DI MATARAM &bull; BMN
              </span>
              <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                KARTU KENDALI PEMELIHARAAN
              </h4>
              <p className="text-xs text-slate-500 font-semibold mb-3">
                GENSET WILSON 100 KVA
              </p>

              {/* QR Code Gambar */}
              <div className="mx-auto h-40 w-40 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs flex items-center justify-center">
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
                Arahkan kamera HP ke QR di atas untuk membuka dashboard riwayat genset seketika
              </p>
            </div>

            {/* Tombol Aksi & Simulasi Testing */}
            <div className="mt-3 space-y-2">

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 rounded-xl bg-[#005baa] py-2 text-xs font-semibold text-white hover:bg-[#004885] shadow-2xs"
                >
                  Cetak Stiker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL PREVIEW FOTO BUKTI */}
      {/* ========================================================================= */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>{previewPhoto.caption || "Dokumentasi Bukti Panel Genset"}</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </button>
            </div>
            <div className="bg-slate-900 flex items-center justify-center p-2">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.caption}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
            <div className="p-3 bg-slate-50 text-right">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
