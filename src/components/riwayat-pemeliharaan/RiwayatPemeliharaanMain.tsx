"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { getUser, logout } from "@/features/authSlice";
import axios from "@/utils/axios";

import type {
  MaintenanceRecord,
  ActiveMaintenanceSession,
  AuthUser,
  PicInfo,
  AssetMetadata,
  MaintenanceOfficer,
  AccessDeniedInfo,
} from "./types";
import {
  DEFAULT_QR_TOKEN,
  EMPTY_ASSET_INFO,
  formatPersonName,
  getSignatureUrl,
  mapLogToRecord,
  mapActiveSession,
  getActivityDynamicStatus,
  getActivityBadge,
  compressAndReadPhotoFile,
} from "./helpers";

import HeaderBar from "./components/HeaderBar";
import AssetHeroCard from "./components/AssetHeroCard";
import ActiveSessionBanner from "./components/ActiveSessionBanner";
import MaintenanceLogTable from "./components/MaintenanceLogTable";
import PrintSheetView from "./components/PrintSheetView";

import ManagePicModal from "./modals/ManagePicModal";
import CheckInModal from "./modals/CheckInModal";
import CheckOutModal from "./modals/CheckOutModal";
import AccessDeniedModal from "./modals/AccessDeniedModal";
import QrStickerModal from "./modals/QrStickerModal";
import PhotoPreviewModal from "./modals/PhotoPreviewModal";

export * from "./types";
export * from "./helpers";

export default function RiwayatPemeliharaanMain() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user: authUser } = useSelector((state: RootState) => state.auth);

  // Endpoint Backend
  const SIMPEL_BMN_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN || "http://localhost:8010";
  const AUTH_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL_AUTH || "http://localhost:8000";

  // State Utama Riwayat Pemeliharaan
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [assetInfo, setAssetInfo] = useState<AssetMetadata>(() => {
    if (typeof window !== "undefined") {
      const tokenFromUrl = new URLSearchParams(window.location.search).get("token");
      if (tokenFromUrl) {
        return { ...EMPTY_ASSET_INFO, qr_token: tokenFromUrl };
      }
    }
    return EMPTY_ASSET_INFO;
  });
  const [assetStatus, setAssetStatus] = useState<"loading" | "found" | "not_found">("loading");
  const [availableAssets, setAvailableAssets] = useState<AssetMetadata[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verifyingLogId, setVerifyingLogId] = useState<number | null>(null);

  // State Manajemen Aset & Petugas Berwenang (Dikelola oleh PIC)
  const [officers, setOfficers] = useState<MaintenanceOfficer[]>([]);
  const [isManagePicModalOpen, setIsManagePicModalOpen] = useState(false);
  const [managePicInitialTab, setManagePicInitialTab] = useState<"assets" | "officers">("officers");
  const [authEmployees, setAuthEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [accessDeniedModal, setAccessDeniedModal] = useState<AccessDeniedInfo | null>(null);

  // Pencarian & Filter Tabel
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth] = useState("all");

  // Navigasi ke Halaman Login Resmi SSO BPOM Percepat (/login)
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
        ? "PIC SIMPEL BMN"
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
      return currentUser.signatureUrl || null;
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
  const [checkInActivityType, setCheckInActivityType] =
    useState<MaintenanceRecord["activityType"]>("warming_up");
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
  const [checkOutStatusAfter, setCheckOutStatusAfter] =
    useState<MaintenanceRecord["statusAfter"]>("standby");
  const [checkOutNotes, setCheckOutNotes] = useState("");
  const [checkOutPhotoUrl, setCheckOutPhotoUrl] = useState<string>("");

  // Mode Cetak: "table" untuk Lembar Kendali Resmi (hanya tabel), "sticker" untuk Stiker QR fisik
  const [printMode, setPrintMode] = useState<"table" | "sticker">("table");

  // Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

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

  const handlePhotoFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    compressAndReadPhotoFile(e, setter, showToast);
  };

  // Ambil sesi user SSO Auth BPOM saat pertama kali render
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // Muat daftar semua aset dari database simpel-bmn
  const fetchAssetsList = useCallback(async () => {
    try {
      const res = await axios.get(`${SIMPEL_BMN_URL}/api/maintenance/assets-list`);
      if (res.data?.success && Array.isArray(res.data.assets)) {
        setAvailableAssets(res.data.assets);
        return res.data.assets as AssetMetadata[];
      }
    } catch (err) {
      console.warn("Gagal memuat daftar aset dari simpel-bmn:", err);
    }
    return [];
  }, [SIMPEL_BMN_URL]);

  useEffect(() => {
    fetchAssetsList();
  }, [fetchAssetsList]);

  // Muat data aset, log, dan petugas resmi langsung dari backend simpel-bmn
  const loadAssetData = useCallback(
    async (overrideToken?: string) => {
      const targetToken = overrideToken || assetInfo.qr_token || DEFAULT_QR_TOKEN;
      try {
        const res = await axios.get(
          `${SIMPEL_BMN_URL}/api/maintenance/asset/${encodeURIComponent(targetToken)}`
        );
        if (res.data?.success && res.data.asset) {
          const a = res.data.asset;
          setAssetInfo({
            id: a.id,
            asset_code: a.asset_code || "",
            name: a.name || "",
            category: a.category || "",
            qr_token: a.qr_token || targetToken,
            current_status: a.current_status || "standby",
            description: a.description || undefined,
            fuel_level_percent: a.fuel_level_percent ?? undefined,
            last_warmed_up_at: a.last_warmed_up_at || undefined,
            last_serviced_at: a.last_serviced_at || undefined,
          });
          setAssetStatus("found");

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
          } else {
            setActiveSession(null);
          }
        }
      } catch (e: any) {
        if (e?.response?.status === 404) {
          setAssetStatus("not_found");
          setRecords([]);
          setOfficers([]);
          setActiveSession(null);
        } else {
          console.warn("Gagal memuat data aset dari simpel-bmn:", e);
          setAssetStatus("not_found");
        }
      }
    },
    [SIMPEL_BMN_URL, assetInfo.qr_token]
  );

  useEffect(() => {
    loadAssetData();
  }, [loadAssetData]);

  // Cek kewenangan akun SSO Auth BPOM ke backend simpel-bmn
  useEffect(() => {
    if (!authUser) {
      setUserAuthority({ isPic: false, isAuthorizedOfficer: false, checked: true });
      return;
    }

    const isPicFromAuthSites =
      Array.isArray(authUser.sites) &&
      authUser.sites.some((s: any) => {
        const siteId = Number(s?.id);
        const siteName = String(s?.name || "").toLowerCase();
        const siteLink = String(s?.link || "").toLowerCase();
        return (
          siteId === 4 ||
          siteName.includes("simpel bmn") ||
          siteName.includes("simpel-bmn") ||
          siteLink.includes("simpel-bmn")
        );
      });

    const checkAuthStatus = async () => {
      try {
        const res = await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/check-authority`, {
          email: authUser.email,
          auth_user_id: authUser.id,
          name: authUser.name,
          nip: authUser.employee?.nip || authUser.nik,
          role: authUser.role?.name || authUser.role?.level || "",
          jabatan: authUser.employee?.jabatan || "",
          sites: Array.isArray(authUser.sites) ? authUser.sites : [],
          qr_token: assetInfo.qr_token,
        });

        if (res.data?.success) {
          const resolvedIsPic = isPicFromAuthSites || !!res.data.is_pic;
          setUserAuthority({
            isPic: resolvedIsPic,
            isAuthorizedOfficer: resolvedIsPic || !!res.data.is_authorized_officer,
            checked: true,
          });
          if (res.data.pic) {
            setPicInfo(res.data.pic);
          }
        }
      } catch (err) {
        console.warn("Gagal cek kewenangan ke simpel-bmn:", err);
        setUserAuthority({
          isPic: isPicFromAuthSites,
          isAuthorizedOfficer: isPicFromAuthSites,
          checked: true,
        });
      }
    };

    checkAuthStatus();
  }, [authUser, SIMPEL_BMN_URL, assetInfo.qr_token]);

  // Muat daftar pegawai dari SSO Auth BPOM jika PIC membuka modal kelola
  useEffect(() => {
    if (userAuthority.isPic && isManagePicModalOpen && authEmployees.length === 0) {
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
  }, [userAuthority.isPic, isManagePicModalOpen, AUTH_URL, authEmployees.length]);

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

  // Handler Buka Modal PIC (Tab Aset atau Tab Petugas)
  const handleOpenManagePicModal = (defaultTab: "assets" | "officers" = "officers") => {
    setManagePicInitialTab(defaultTab);
    setIsManagePicModalOpen(true);
  };

  // Handler Ganti Aset Aktif yang Ditampilkan
  const handleSelectAssetToken = async (qrToken: string) => {
    if (!qrToken) return;
    setAssetStatus("loading");
    setAssetInfo((prev) => ({ ...prev, qr_token: qrToken }));
    await loadAssetData(qrToken);
  };

  // Handler PIC: Tambah Aset Pemeliharaan Baru
  const handleCreateAsset = async (payload: {
    asset_code: string;
    name: string;
    category: string;
    description?: string;
  }): Promise<boolean> => {
    try {
      const res = await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/assets`, payload);
      if (res.data?.success && res.data.asset) {
        const createdAsset = res.data.asset as AssetMetadata;
        await fetchAssetsList();
        await loadAssetData(createdAsset.qr_token);
        showToast(`✓ Aset "${createdAsset.name}" berhasil ditambahkan!`);
        return true;
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Gagal menambahkan aset baru.";
      showToast(`⚠️ ${errMsg}`);
    }
    return false;
  };

  // Handler PIC: Update Data Aset Pemeliharaan
  const handleUpdateAsset = async (
    id: number,
    payload: {
      asset_code: string;
      name: string;
      category: string;
      description?: string;
    }
  ): Promise<boolean> => {
    try {
      const res = await axios.put(`${SIMPEL_BMN_URL}/api/maintenance/assets/${id}`, payload);
      if (res.data?.success && res.data.asset) {
        await fetchAssetsList();
        await loadAssetData(res.data.asset.qr_token);
        showToast(`✓ Data aset "${res.data.asset.name}" berhasil diperbarui!`);
        return true;
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Gagal memperbarui data aset.";
      showToast(`⚠️ ${errMsg}`);
    }
    return false;
  };

  // Handler PIC: Hapus Aset Pemeliharaan
  const handleDeleteAsset = async (id: number, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus aset "${name}" beserta daftar petugas & riwayat pemeliharaannya?`
      )
    ) {
      return;
    }
    try {
      const res = await axios.delete(`${SIMPEL_BMN_URL}/api/maintenance/assets/${id}`);
      if (res.data?.success) {
        const remaining = await fetchAssetsList();
        showToast(`Aset "${name}" berhasil dihapus.`);
        if (remaining.length > 0) {
          await loadAssetData(remaining[0].qr_token);
        } else {
          setAssetInfo(EMPTY_ASSET_INFO);
          setAssetStatus("not_found");
          setRecords([]);
          setOfficers([]);
          setActiveSession(null);
        }
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Gagal menghapus aset.";
      showToast(`⚠️ ${errMsg}`);
    }
  };

  // Handler PIC: Tambah Petugas Berwenang
  const handleAddOfficer = async (payload: {
    maintenance_asset_id: number;
    name: string;
    email: string;
    auth_user_id: string | number | null;
    nip: string;
  }): Promise<boolean> => {
    if (!currentUser?.isPic) {
      showToast("⚠️ Hanya PIC yang memiliki wewenang menambahkan petugas.");
      return false;
    }
    try {
      const res = await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/officers`, {
        maintenance_asset_id: payload.maintenance_asset_id,
        nip: payload.nip || "-",
        name: payload.name,
        email: payload.email,
        auth_user_id: payload.auth_user_id,
        added_by_name: `${currentUser.name} (PIC)`,
      });

      if (res.data?.success && res.data?.officer) {
        setOfficers((prev) => [...prev, res.data.officer]);
        showToast(`✓ Petugas ${payload.name} berhasil ditambahkan ke daftar berwenang.`);
        return true;
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || "Gagal menambahkan petugas ke database.";
      showToast(`⚠️ ${errMsg}`);
    }
    return false;
  };

  // Handler PIC: Cabut Hak Akses Petugas
  const handleDeleteOfficer = async (officerId: number, officerName: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin mencabut kewenangan pemeliharaan dari ${officerName}?`
      )
    ) {
      return;
    }

    try {
      const res = await axios.delete(
        `${SIMPEL_BMN_URL}/api/maintenance/officers/${officerId}`
      );
      if (res.data?.success) {
        setOfficers((prev) => prev.filter((o) => o.id !== officerId));
        showToast(`Kewenangan petugas ${officerName} berhasil dicabut.`);
      }
    } catch (err) {
      console.warn("Gagal hapus petugas:", err);
      setOfficers((prev) => prev.filter((o) => o.id !== officerId));
      showToast(`Kewenangan petugas ${officerName} dicabut.`);
    }
  };

  // Handler Buka Form Check-in (Mengecek Kewenangan Hak Akses Petugas / PIC)
  const handleInitiateNewActivity = () => {
    if (assetStatus !== "found") {
      showToast("⚠️ Aset belum terdaftar di database Simpel BMN.");
      return;
    }
    if (activeSession) {
      showToast(
        "⚠️ Ada kegiatan pemeliharaan yang sedang berjalan! Selesaikan kegiatan tersebut terlebih dahulu."
      );
      return;
    }

    if (!currentUser) {
      redirectToLogin();
      return;
    }

    const isPic = currentUser.isPic;
    const isAuthorized =
      userAuthority.isAuthorizedOfficer ||
      officers.some((off) => {
        if (!off.is_active) return false;
        const matchesAsset =
          off.maintenance_asset_id === assetInfo.id || !off.maintenance_asset_id;
        if (!matchesAsset) return false;

        if (
          off.nip &&
          off.nip !== "-" &&
          currentUser.nip &&
          off.nip.replace(/\s+/g, "") === currentUser.nip.replace(/\s+/g, "")
        ) {
          return true;
        }

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
        setActiveSession({
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
        });
      }
    } catch (err) {
      console.warn("Gagal simpan check-in ke backend simpel-bmn:", err);
      setActiveSession({
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
      });
    } finally {
      setIsSubmitting(false);
      setIsCheckInModalOpen(false);
      showToast(
        `⚡ Kegiatan dimulai! Status aset kini '${getActivityDynamicStatus(checkInActivityType)}'.`
      );
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
    } catch (err) {
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
    if (
      confirm(
        "Apakah Anda yakin ingin membatalkan sesi kegiatan yang sedang berjalan ini?"
      )
    ) {
      try {
        await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/cancel-active-session`, {
          log_id: activeSession.id,
        });
        loadAssetData();
      } catch (err) {
        console.warn("Gagal batalkan sesi di backend:", err);
      } finally {
        setActiveSession(null);
        showToast("Sesi kegiatan dibatalkan. Aset kembali ke status Siaga.");
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
      showToast(
        `✓ Catatan pemeliharaan disetujui & diverifikasi resmi oleh PIC (${picDisplayName})!`
      );
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

      const matchMonth =
        selectedMonth === "all" || r.date.startsWith(`2026-${selectedMonth}`);

      return matchSearch && matchMonth;
    });
  }, [records, searchQuery, selectedMonth]);

  const latestRecord = records[0];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 font-sans text-slate-800 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-md no-print print:hidden">
          <Icon
            icon="solar:bell-bing-bold"
            width={16}
            className="text-emerald-400 shrink-0"
          />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Navigasi & Status Akun */}
      <HeaderBar
        currentUser={currentUser}
        activeSession={activeSession}
        assetFound={assetStatus === "found"}
        onOpenManagePicModal={handleOpenManagePicModal}
        onLogout={handleLogout}
        onRedirectLogin={redirectToLogin}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onPrintTable={handlePrintTable}
        onInitiateNewActivity={handleInitiateNewActivity}
      />

      {/* Konten Utama */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-5 no-print print:hidden">
        {/* 2. Kartu Identitas Aset / Empty State / Pemilih Aset */}
        <AssetHeroCard
          assetStatus={assetStatus}
          assetInfo={assetInfo}
          availableAssets={availableAssets}
          activeSession={activeSession}
          officers={officers}
          latestRecord={latestRecord}
          isPic={currentUser?.isPic}
          onSelectAssetToken={handleSelectAssetToken}
          onOpenManagePicModal={handleOpenManagePicModal}
        />

        {assetStatus === "found" && (
          <>
            {/* 3. Banner Kegiatan Berlangsung (Jika Ada) */}
            {activeSession && (
              <ActiveSessionBanner
                activeSession={activeSession}
                runningMinutes={runningMinutes}
                onCancelSession={handleCancelActiveSession}
                onOpenCheckOutModal={openCheckOutModal}
              />
            )}

            {/* 4 & 5. Pencarian & Tabel Log Riwayat Pemeliharaan */}
            <MaintenanceLogTable
              assetName={assetInfo.name}
              records={records}
              filteredRecords={filteredRecords}
              searchQuery={searchQuery}
              onChangeSearch={setSearchQuery}
              currentUser={currentUser}
              verifyingLogId={verifyingLogId}
              onVerifyLog={handleVerify}
              onPreviewPhoto={setPreviewPhoto}
              onRedirectLogin={redirectToLogin}
              onShowToast={showToast}
            />
          </>
        )}
      </main>

      {/* 6. Modal Khusus PIC: Kelola Aset BMN & Kelola Petugas (2 Tab) */}
      {currentUser?.isPic && (
        <ManagePicModal
          isOpen={isManagePicModalOpen}
          initialTab={managePicInitialTab}
          onClose={() => setIsManagePicModalOpen(false)}
          availableAssets={availableAssets}
          activeAssetToken={assetInfo.qr_token}
          officers={officers}
          authEmployees={authEmployees}
          loadingEmployees={loadingEmployees}
          onSelectActiveAsset={handleSelectAssetToken}
          onCreateAsset={handleCreateAsset}
          onUpdateAsset={handleUpdateAsset}
          onDeleteAsset={handleDeleteAsset}
          onAddOfficer={handleAddOfficer}
          onDeleteOfficer={handleDeleteOfficer}
        />
      )}

      {/* 7. Modal Alert: Penolakan Akses */}
      <AccessDeniedModal
        accessDeniedModal={accessDeniedModal}
        assetName={assetInfo.name}
        picName={picInfo?.name}
        onClose={() => setAccessDeniedModal(null)}
        onSwitchAccount={() => {
          setAccessDeniedModal(null);
          redirectToLogin();
        }}
      />

      {/* 8. Modal Langkah 1: Check-in (Mulai Kegiatan) */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        assetName={assetInfo.name}
        currentUser={currentUser}
        checkInTimeCaptured={checkInTimeCaptured}
        checkInActivityType={checkInActivityType}
        onChangeActivityType={setCheckInActivityType}
        checkInCustomType={checkInCustomType}
        onChangeCustomType={setCheckInCustomType}
        checkInDetails={checkInDetails}
        onChangeDetails={setCheckInDetails}
        checkInPhotoUrl={checkInPhotoUrl}
        onChangePhotoUrl={setCheckInPhotoUrl}
        onPhotoFileChange={handlePhotoFileChange}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitCheckIn}
      />

      {/* 9. Modal Langkah 2: Check-out (Selesaikan Kegiatan) */}
      <CheckOutModal
        isOpen={isCheckOutModalOpen}
        onClose={() => setIsCheckOutModalOpen(false)}
        activeSession={activeSession}
        checkOutTimeCaptured={checkOutTimeCaptured}
        checkOutStatusAfter={checkOutStatusAfter}
        onChangeStatusAfter={setCheckOutStatusAfter}
        checkOutNotes={checkOutNotes}
        onChangeNotes={setCheckOutNotes}
        checkOutPhotoUrl={checkOutPhotoUrl}
        onChangePhotoUrl={setCheckOutPhotoUrl}
        onPhotoFileChange={handlePhotoFileChange}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitCheckOut}
      />

      {/* 10. Modal Stiker QR Fisik */}
      <QrStickerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        assetInfo={assetInfo}
        qrHostMode={qrHostMode}
        onChangeHostMode={setQrHostMode}
        onPrintSticker={handlePrintSticker}
      />

      {/* 11. Modal Preview Foto Bukti */}
      <PhotoPreviewModal
        previewPhoto={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />

      {/* 12. Tampilan Khusus Cetak (Lembar Kendali Resmi & Stiker QR) */}
      <PrintSheetView
        printMode={printMode}
        qrHostMode={qrHostMode}
        assetInfo={assetInfo}
        picInfo={picInfo}
        filteredRecords={filteredRecords}
        executorSignatureUrl={executorSignatureUrl}
        picSignatureUrl={picSignatureUrl}
      />
    </div>
  );
}
