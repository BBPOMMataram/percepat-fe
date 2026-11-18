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
  MasterBarangItem,
  MaintenanceOfficer,
  AccessDeniedInfo,
  PhotoGalleryPreview,
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
  compressAndReadMultiplePhotos,
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
      const tokenFromUrl = new URLSearchParams(window.location.search).get(
        "token"
      );
      if (tokenFromUrl) {
        return { ...EMPTY_ASSET_INFO, qr_token: tokenFromUrl };
      }
    }
    return EMPTY_ASSET_INFO;
  });
  const [assetStatus, setAssetStatus] = useState<
    "loading" | "found" | "not_found"
  >("loading");
  const [availableAssets, setAvailableAssets] = useState<AssetMetadata[]>([]);
  const [masterBarangs, setMasterBarangs] = useState<MasterBarangItem[]>([]);
  const [loadingMasterBarangs, setLoadingMasterBarangs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verifyingLogId, setVerifyingLogId] = useState<number | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  // State Manajemen Aset & Petugas Berwenang (Dikelola oleh PIC)
  const [officers, setOfficers] = useState<MaintenanceOfficer[]>([]);
  const [isManagePicModalOpen, setIsManagePicModalOpen] = useState(false);
  const [managePicInitialTab, setManagePicInitialTab] = useState<
    "assets" | "officers"
  >("officers");
  const [authEmployees, setAuthEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [accessDeniedModal, setAccessDeniedModal] =
    useState<AccessDeniedInfo | null>(null);

  // Pencarian & Filter Kombinasi Tabel (Bulan, Tahun, Jenis Kegiatan)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedActivityType, setSelectedActivityType] = useState("all");

  // Navigasi ke Halaman Login Resmi SSO BPOM Percepat (/login)
  const redirectToLogin = useCallback(() => {
    router.push("/login?redirectUrl=/simpel-bmn/pemeliharaan-rutin");
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

  // Resolusi Profil PIC & URL Tanda Tangan PIC dari Database Auth-BPOM (Selalu muncul untuk siapapun, baik login maupun tidak login)
  const resolvedPicInfo: PicInfo | null = useMemo(() => {
    const matchedAuthPic = authEmployees.find((emp: any) => {
      if (picInfo?.email && emp.email && String(emp.email).toLowerCase() === String(picInfo.email).toLowerCase()) {
        return true;
      }
      if (picInfo?.id && emp.id && String(emp.id) === String(picInfo.id)) {
        return true;
      }
      const empRawName = (emp.name || "").trim().toLowerCase();
      const empFormattedName = formatPersonName(
        emp.name,
        emp.employee?.gelar_depan,
        emp.employee?.gelar_belakang
      )
        .trim()
        .toLowerCase();
      const targetPicName = (picInfo?.name || "").trim().toLowerCase();
      const targetPicRaw = (picInfo?.raw_name || "").trim().toLowerCase();

      if (
        targetPicName &&
        targetPicName !== "pic bmn" &&
        (empRawName === targetPicName ||
          empFormattedName === targetPicName ||
          (targetPicRaw && empRawName === targetPicRaw))
      ) {
        return true;
      }

      // Cek apakah user memiliki site SIMPEL BMN (id = 4) di data Auth
      if (Array.isArray(emp.sites)) {
        const hasSimpelSite = emp.sites.some((s: any) => {
          const sId = Number(s?.id);
          const sName = String(s?.name || "").toLowerCase();
          return sId === 4 || sName.includes("simpel bmn") || sName.includes("simpel-bmn");
        });
        if (hasSimpelSite) return true;
      }

      return false;
    });

    if (!picInfo && !matchedAuthPic) return null;

    const fullNameFromAuth = matchedAuthPic
      ? formatPersonName(
          matchedAuthPic.name,
          matchedAuthPic.employee?.gelar_depan,
          matchedAuthPic.employee?.gelar_belakang
        )
      : null;

    const cleanAuthNip =
      matchedAuthPic?.employee?.nip &&
      matchedAuthPic.employee.nip !== "-" &&
      String(matchedAuthPic.employee.nip).toLowerCase() !== "null"
        ? matchedAuthPic.employee.nip
        : null;

    return {
      id: picInfo?.id || matchedAuthPic?.id,
      name: fullNameFromAuth || picInfo?.name || "PIC BMN",
      raw_name: matchedAuthPic?.name || picInfo?.raw_name,
      email: picInfo?.email || matchedAuthPic?.email,
      nip: picInfo?.nip || cleanAuthNip || null,
      jabatan:
        picInfo?.jabatan && picInfo.jabatan !== "PIC BMN"
          ? picInfo.jabatan
          : matchedAuthPic?.employee?.jabatan || "PIC BMN",
      signature_path:
        picInfo?.signature_path || matchedAuthPic?.signature_path || null,
      role_title: picInfo?.role_title || "PIC BMN",
    };
  }, [picInfo, authEmployees]);

  const picSignatureUrl = useMemo(() => {
    if (resolvedPicInfo?.signature_path) {
      return getSignatureUrl(resolvedPicInfo.signature_path);
    }
    if (currentUser?.isPic && currentUser.signatureUrl) {
      return currentUser.signatureUrl;
    }
    const verifiedRecWithSig = records.find((r) => r.verifierSignatureUrl);
    if (verifiedRecWithSig?.verifierSignatureUrl) {
      return verifiedRecWithSig.verifierSignatureUrl;
    }
    return null;
  }, [resolvedPicInfo?.signature_path, currentUser, records]);

  // Resolusi URL Tanda Tangan Pelaksana untuk setiap baris log (dari DB Auth)
  const resolveExecutorSignature = useCallback(
    (item: MaintenanceRecord): string | null => {
      if (item.executorSignatureUrl) {
        return item.executorSignatureUrl;
      }
      if (
        currentUser &&
        currentUser.signatureUrl &&
        ((item.userId && String(item.userId) === String(currentUser.id)) ||
          currentUser.name.toLowerCase() === item.executorName.toLowerCase() ||
          (currentUser.rawName &&
            currentUser.rawName.toLowerCase() ===
              item.executorName.toLowerCase()))
      ) {
        return currentUser.signatureUrl;
      }
      const matched = authEmployees.find(
        (e) =>
          (item.userId && String(e.id) === String(item.userId)) ||
          (e.name || "").toLowerCase() === item.executorName.toLowerCase() ||
          formatPersonName(
            e.name,
            e.employee?.gelar_depan,
            e.employee?.gelar_belakang
          ).toLowerCase() === item.executorName.toLowerCase()
      );
      if (matched?.signature_path) {
        return getSignatureUrl(matched.signature_path);
      }
      return null;
    },
    [currentUser, authEmployees]
  );

  // State Sesi Kegiatan Aktif (Langkah 1 Check-in -> Langkah 2 Check-out)
  const [activeSession, setActiveSession] =
    useState<ActiveMaintenanceSession | null>(null);
  const [runningMinutes, setRunningMinutes] = useState(0);

  // Cek apakah user yang sedang login adalah petugas pemilik sesi aktif (atau PIC)
  // User lain yang berkunjung HANYA melihat titik indikator status di Hero Card, tanpa kotak Check-out!
  const canManageActiveSession = useMemo(() => {
    if (!activeSession || !currentUser) return false;
    if (currentUser.isPic) return true;

    if (
      activeSession.userId &&
      currentUser.id &&
      String(activeSession.userId) === String(currentUser.id)
    ) {
      return true;
    }

    if (
      activeSession.executorNip &&
      activeSession.executorNip !== "-" &&
      currentUser.nip &&
      activeSession.executorNip.replace(/\s+/g, "") ===
        currentUser.nip.replace(/\s+/g, "")
    ) {
      return true;
    }

    const sessExec = (activeSession.executorName || "").trim().toLowerCase();
    const currName = (currentUser.name || "").trim().toLowerCase();
    const currRaw = (currentUser.rawName || "").trim().toLowerCase();
    return sessExec !== "" && (sessExec === currName || sessExec === currRaw);
  }, [activeSession, currentUser]);

  // Cek apakah petugas berhak menghapus baris catatan yang belum disetujui PIC
  const canDeleteRecord = useCallback(
    (item: MaintenanceRecord): boolean => {
      if (item.isVerified || !currentUser || currentUser.isPic) return false;

      if (
        item.userId &&
        currentUser.id &&
        String(item.userId) === String(currentUser.id)
      ) {
        return true;
      }

      if (
        item.executorNip &&
        item.executorNip !== "-" &&
        currentUser.nip &&
        item.executorNip.replace(/\s+/g, "") ===
          currentUser.nip.replace(/\s+/g, "")
      ) {
        return true;
      }

      const recExec = (item.executorName || "").trim().toLowerCase();
      const currName = (currentUser.name || "").trim().toLowerCase();
      const currRaw = (currentUser.rawName || "").trim().toLowerCase();
      return recExec !== "" && (recExec === currName || recExec === currRaw);
    },
    [currentUser]
  );

  // State Modals
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] =
    useState<PhotoGalleryPreview | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Check-in (Mendukung Multi-Foto)
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
    useState<MaintenanceRecord["activityType"]>("module_check");
  const [checkInCustomType, setCheckInCustomType] = useState("");
  const [checkInDetails, setCheckInDetails] = useState("");
  const [checkInPhotos, setCheckInPhotos] = useState<string[]>([]);

  // Form Check-out (Mendukung Multi-Foto)
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
  const [checkOutPhotos, setCheckOutPhotos] = useState<string[]>([]);

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

  const handleAddCheckInPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    compressAndReadMultiplePhotos(e, setCheckInPhotos, showToast);
  };

  const handleRemoveCheckInPhoto = (idx: number) => {
    setCheckInPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddCheckOutPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    compressAndReadMultiplePhotos(e, setCheckOutPhotos, showToast);
  };

  const handleRemoveCheckOutPhoto = (idx: number) => {
    setCheckOutPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Ambil sesi user SSO Auth BPOM saat pertama kali render
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // Muat daftar semua aset dari database simpel-bmn
  const fetchAssetsList = useCallback(async () => {
    try {
      const res = await axios.get(
        `${SIMPEL_BMN_URL}/api/maintenance/assets-list`
      );
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

  // Muat daftar Master Barang dari tabel barangs di simpel-bmn
  const fetchMasterBarangs = useCallback(async () => {
    setLoadingMasterBarangs(true);
    try {
      const res = await axios.get(
        `${SIMPEL_BMN_URL}/api/maintenance/master-barangs`
      );
      if (res.data?.success && Array.isArray(res.data.barangs)) {
        setMasterBarangs(res.data.barangs);
      }
    } catch (err) {
      console.warn("Gagal memuat master barangs dari simpel-bmn:", err);
    } finally {
      setLoadingMasterBarangs(false);
    }
  }, [SIMPEL_BMN_URL]);

  // Muat data aset, log, dan petugas resmi langsung dari backend simpel-bmn
  const loadAssetData = useCallback(
    async (overrideToken?: string) => {
      const targetToken =
        overrideToken || assetInfo.qr_token || DEFAULT_QR_TOKEN;
      try {
        const res = await axios.get(
          `${SIMPEL_BMN_URL}/api/maintenance/asset/${encodeURIComponent(
            targetToken
          )}`
        );
        if (res.data?.success && res.data.asset) {
          const a = res.data.asset;
          setAssetInfo({
            id: a.id,
            barang_id: a.barang_id ?? null,
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
      setUserAuthority({
        isPic: false,
        isAuthorizedOfficer: false,
        checked: true,
      });
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
        const res = await axios.post(
          `${SIMPEL_BMN_URL}/api/maintenance/check-authority`,
          {
            email: authUser.email,
            auth_user_id: authUser.id,
            name: authUser.name,
            nip: authUser.employee?.nip || authUser.nik,
            role: authUser.role?.name || authUser.role?.level || "",
            jabatan: authUser.employee?.jabatan || "",
            signature_path: authUser.signature_path || null,
            sites: Array.isArray(authUser.sites) ? authUser.sites : [],
            qr_token: assetInfo.qr_token,
          }
        );

        if (res.data?.success) {
          const resolvedIsPic = isPicFromAuthSites || !!res.data.is_pic;
          setUserAuthority({
            isPic: resolvedIsPic,
            isAuthorizedOfficer:
              resolvedIsPic || !!res.data.is_authorized_officer,
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

  // Muat daftar pegawai & tanda tangan dari SSO Auth BPOM saat halaman dibuka (agar TTD PIC & Petugas selalu muncul untuk siapapun)
  useEffect(() => {
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
  }, [AUTH_URL]);

  // Muat Master Barang jika PIC membuka modal kelola
  useEffect(() => {
    if (userAuthority.isPic && isManagePicModalOpen) {
      fetchMasterBarangs();
    }
  }, [userAuthority.isPic, isManagePicModalOpen, fetchMasterBarangs]);

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
  const handleOpenManagePicModal = (
    defaultTab: "assets" | "officers" = "officers"
  ) => {
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

  // Handler PIC: Tambah Aset Pemeliharaan dari Dropdown Master Barang
  const handleCreateAssetFromMaster = async (
    barang: MasterBarangItem
  ): Promise<boolean> => {
    try {
      const res = await axios.post(`${SIMPEL_BMN_URL}/api/maintenance/assets`, {
        barang_id: barang.id,
        asset_code: barang.asset_code,
        name: barang.display_name,
        category: barang.category,
      });
      if (res.data?.success && res.data.asset) {
        const createdAsset = res.data.asset as AssetMetadata;
        await fetchAssetsList();
        await fetchMasterBarangs();
        await loadAssetData(createdAsset.qr_token);
        showToast(
          `✓ Aset "${createdAsset.name}" berhasil ditambahkan dari Master Barang!`
        );
        return true;
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || "Gagal menambahkan aset dari master.";
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
      const res = await axios.delete(
        `${SIMPEL_BMN_URL}/api/maintenance/assets/${id}`
      );
      if (res.data?.success) {
        const remaining = await fetchAssetsList();
        await fetchMasterBarangs();
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
      const res = await axios.post(
        `${SIMPEL_BMN_URL}/api/maintenance/officers`,
        {
          maintenance_asset_id: payload.maintenance_asset_id,
          nip: payload.nip || "-",
          name: payload.name,
          email: payload.email,
          auth_user_id: payload.auth_user_id,
          added_by_name: `${currentUser.name} (PIC)`,
        }
      );

      if (res.data?.success && res.data?.officer) {
        setOfficers((prev) => [...prev, res.data.officer]);
        showToast(
          `✓ Petugas ${payload.name} berhasil ditambahkan ke daftar berwenang.`
        );
        return true;
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        "Gagal menambahkan petugas ke database.";
      showToast(`⚠️ ${errMsg}`);
    }
    return false;
  };

  // Handler PIC: Cabut Hak Akses Petugas
  const handleDeleteOfficer = async (
    officerId: number,
    officerName: string
  ) => {
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
          off.maintenance_asset_id === assetInfo.id ||
          !off.maintenance_asset_id;
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

    setCheckInActivityType("module_check");
    setCheckInCustomType("");
    setCheckInDetails("");
    setCheckInPhotos([]);
    setIsCheckInModalOpen(true);
  };

  // Handler Logout SSO BPOM
  const handleLogout = async () => {
    await dispatch(logout());
    setUserAuthority({
      isPic: false,
      isAuthorizedOfficer: false,
      checked: false,
    });
    showToast("Berhasil keluar dari akun SSO BPOM.");
  };

  // Submit Langkah 1: Check-in (Mulai Kegiatan)
  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkInPhotos.length === 0) {
      showToast("⚠️ Harap lampirkan minimal 1 foto bukti sebelum memulai kegiatan.");
      return;
    }
    setIsSubmitting(true);

    const activityLabel =
      checkInActivityType === "other" && checkInCustomType.trim()
        ? checkInCustomType.trim()
        : getActivityBadge(checkInActivityType).label;

    const payload = {
      qr_token: assetInfo.qr_token,
      activity_type: checkInActivityType,
      activity_details: checkInDetails.trim() || activityLabel,
      initial_photos: checkInPhotos.length > 0 ? checkInPhotos : undefined,
      initial_photo_url: checkInPhotos[0] || undefined,
      user_id: authUser?.id,
      executor_name: currentUser?.name || authUser?.name || "Petugas",
      executor_role: currentUser?.role || "Petugas",
      executor_nip: currentUser?.nip || null,
      executor_signature_path:
        currentUser?.signaturePath || authUser?.signature_path || null,
    };

    try {
      const res = await axios.post(
        `${SIMPEL_BMN_URL}/api/maintenance/check-in`,
        payload
      );
      if (res.data?.success && res.data.active_session) {
        setActiveSession(mapActiveSession(res.data.active_session));
        await loadAssetData();
        setIsCheckInModalOpen(false);
        showToast(
          `⚡ Kegiatan dimulai! Status aset kini '${getActivityDynamicStatus(
            checkInActivityType
          )}'.`
        );
      } else {
        showToast(
          `⚠️ ${
            res.data?.message ||
            "Gagal menyimpan check-in ke database SIMPEL BMN."
          }`
        );
      }
    } catch (err: any) {
      console.error("Gagal simpan check-in ke backend simpel-bmn:", err);
      const errMsg =
        err?.response?.data?.message ||
        "Gagal menyimpan check-in ke server SIMPEL BMN. Periksa koneksi atau ukuran foto.";
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setIsSubmitting(false);
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
    setCheckOutPhotos([]);
    setIsCheckOutModalOpen(true);
  };

  // Submit Langkah 2: Check-out (Selesaikan & Simpan Log Permanen)
  const handleSubmitCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    if (checkOutPhotos.length === 0) {
      showToast("⚠️ Harap lampirkan minimal 1 foto bukti sesudah kegiatan.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await axios.post(
        `${SIMPEL_BMN_URL}/api/maintenance/check-out`,
        {
          log_id: activeSession.id,
          status_after: checkOutStatusAfter,
          notes: checkOutNotes.trim() || undefined,
          final_photos:
            checkOutPhotos.length > 0 ? checkOutPhotos : undefined,
          final_photo_url: checkOutPhotos[0] || undefined,
        }
      );

      if (res.data?.success) {
        setActiveSession(null);
        setIsCheckOutModalOpen(false);
        await loadAssetData();
        showToast(
          "✓ Kegiatan pemeliharaan berhasil diselesaikan dan dicatat ke riwayat!"
        );
      } else {
        showToast(
          `⚠️ ${
            res.data?.message ||
            "Gagal menyimpan check-out ke database SIMPEL BMN."
          }`
        );
      }
    } catch (err: any) {
      console.error("Gagal checkout ke backend simpel-bmn:", err);
      const errMsg =
        err?.response?.data?.message ||
        "Gagal menyelesaikan kegiatan di server SIMPEL BMN.";
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setIsSubmitting(false);
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
        await axios.post(
          `${SIMPEL_BMN_URL}/api/maintenance/cancel-active-session`,
          {
            log_id: activeSession.id,
          }
        );
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
      const res = await axios.post(
        `${SIMPEL_BMN_URL}/api/maintenance/verify/${id}`,
        {
          verifier_name: picDisplayName,
          verifier_id: authUser?.id || resolvedPicInfo?.id,
          verifier_signature_path:
            currentUser?.signaturePath ||
            authUser?.signature_path ||
            resolvedPicInfo?.signature_path ||
            null,
        }
      );
      if (res.data?.success) {
        await loadAssetData();
        showToast(
          `✓ Catatan pemeliharaan disetujui & diverifikasi resmi oleh PIC (${picDisplayName})!`
        );
      }
    } catch (err: any) {
      console.error("Gagal verifikasi log ke backend simpel-bmn:", err);
      const errMsg =
        err?.response?.data?.message ||
        "Gagal memverifikasi catatan pemeliharaan di server.";
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setVerifyingLogId(null);
    }
  };

  // Hapus Catatan Pemeliharaan oleh Petugas (sebelum disetujui PIC)
  const handleDeleteLog = async (id: number) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus catatan pemeliharaan ini? Data yang sudah dihapus tidak dapat dikembalikan."
      )
    ) {
      return;
    }

    setDeletingLogId(id);
    try {
      const res = await axios.delete(
        `${SIMPEL_BMN_URL}/api/maintenance/logs/${id}`
      );
      if (res.data?.success) {
        await loadAssetData();
        showToast("✓ Catatan riwayat pemeliharaan berhasil dihapus.");
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        "Gagal menghapus catatan pemeliharaan.";
      showToast(`⚠️ ${errMsg}`);
    } finally {
      setDeletingLogId(null);
    }
  };

  // Daftar Tahun yang Tersedia untuk Filter
  const availableYears = useMemo(() => {
    const currentYr = String(new Date().getFullYear());
    const yearSet = new Set<string>([currentYr]);
    records.forEach((r) => {
      if (r.date && r.date.length >= 4) {
        yearSet.add(r.date.slice(0, 4));
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedMonth("all");
    setSelectedYear("all");
    setSelectedActivityType("all");
  };

  // Filter Kombinasi Data Riwayat (Pencarian + Bulan + Tahun + Jenis Kegiatan)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const typeLabel = getActivityBadge(r.activityType).label.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        typeLabel.includes(q) ||
        r.executorName.toLowerCase().includes(q) ||
        (r.activityDetails || "").toLowerCase().includes(q) ||
        (r.notes || "").toLowerCase().includes(q);

      const parts = (r.date || "").split("-");
      const recYear = parts[0] || "";
      const recMonth = parts[1] || "";

      const matchYear = selectedYear === "all" || recYear === selectedYear;
      const matchMonth = selectedMonth === "all" || recMonth === selectedMonth;
      const matchType =
        selectedActivityType === "all" ||
        r.activityType === selectedActivityType;

      return matchSearch && matchYear && matchMonth && matchType;
    });
  }, [
    records,
    searchQuery,
    selectedMonth,
    selectedYear,
    selectedActivityType,
  ]);

  const latestRecord = records[0];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 font-sans text-slate-800 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:bottom-5 sm:right-5 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 sm:max-w-md no-print print:hidden">
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
            {/* 3. Banner Check-out Kegiatan Berlangsung (HANYA muncul untuk Petugas yang Check-in atau PIC) */}
            {activeSession && canManageActiveSession && (
              <ActiveSessionBanner
                activeSession={activeSession}
                runningMinutes={runningMinutes}
                onCancelSession={handleCancelActiveSession}
                onOpenCheckOutModal={openCheckOutModal}
              />
            )}

            {/* 4 & 5. Filter Kombinasi, Tabel Log Riwayat & Pagination */}
            <MaintenanceLogTable
              assetName={assetInfo.name}
              records={records}
              filteredRecords={filteredRecords}
              searchQuery={searchQuery}
              onChangeSearch={setSearchQuery}
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              selectedYear={selectedYear}
              onChangeYear={setSelectedYear}
              availableYears={availableYears}
              selectedActivityType={selectedActivityType}
              onChangeActivityType={setSelectedActivityType}
              onResetFilters={handleResetFilters}
              currentUser={currentUser}
              picSignatureUrl={picSignatureUrl}
              resolveExecutorSignature={resolveExecutorSignature}
              canDeleteRecord={canDeleteRecord}
              verifyingLogId={verifyingLogId}
              deletingLogId={deletingLogId}
              onVerifyLog={handleVerify}
              onDeleteLog={handleDeleteLog}
              onPreviewPhoto={setPreviewPhoto}
            />
          </>
        )}
      </main>

      {/* 6. Modal Khusus PIC: Kelola Aset BMN (Master Barang) & Kelola Petugas (2 Tab) */}
      {currentUser?.isPic && (
        <ManagePicModal
          isOpen={isManagePicModalOpen}
          initialTab={managePicInitialTab}
          onClose={() => setIsManagePicModalOpen(false)}
          availableAssets={availableAssets}
          activeAssetToken={assetInfo.qr_token}
          masterBarangs={masterBarangs}
          loadingMasterBarangs={loadingMasterBarangs}
          officers={officers}
          authEmployees={authEmployees}
          loadingEmployees={loadingEmployees}
          onSelectActiveAsset={handleSelectAssetToken}
          onCreateAssetFromMaster={handleCreateAssetFromMaster}
          onDeleteAsset={handleDeleteAsset}
          onAddOfficer={handleAddOfficer}
          onDeleteOfficer={handleDeleteOfficer}
        />
      )}

      {/* 7. Modal Alert: Penolakan Akses */}
      <AccessDeniedModal
        accessDeniedModal={accessDeniedModal}
        assetName={assetInfo.name}
        picName={resolvedPicInfo?.name}
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
        checkInPhotos={checkInPhotos}
        onAddPhotos={handleAddCheckInPhotos}
        onRemovePhoto={handleRemoveCheckInPhoto}
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
        checkOutPhotos={checkOutPhotos}
        onAddPhotos={handleAddCheckOutPhotos}
        onRemovePhoto={handleRemoveCheckOutPhoto}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitCheckOut}
      />

      {/* 10. Modal Stiker QR Fisik */}
      <QrStickerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        assetInfo={assetInfo}
        onPrintSticker={handlePrintSticker}
      />

      {/* 11. Modal Preview Galeri Foto Bukti */}
      <PhotoPreviewModal
        previewPhoto={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />

      {/* 12. Tampilan Khusus Cetak (Lembar Kendali Resmi dengan header.png & TTD PIC Kanan) */}
      <PrintSheetView
        printMode={printMode}
        assetInfo={assetInfo}
        picInfo={resolvedPicInfo}
        filteredRecords={filteredRecords}
        resolveExecutorSignature={resolveExecutorSignature}
        picSignatureUrl={picSignatureUrl}
      />
    </div>
  );
}
