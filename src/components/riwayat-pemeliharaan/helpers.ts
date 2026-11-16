import type {
  ActiveMaintenanceSession,
  AssetMetadata,
  MaintenanceRecord,
} from "./types";

export const DEFAULT_QR_TOKEN = "bpom-genset-mataram-01";

export const EMPTY_ASSET_INFO: AssetMetadata = {
  id: 0,
  asset_code: "",
  name: "",
  category: "",
  qr_token: DEFAULT_QR_TOKEN,
  current_status: "",
};

// Format nama pegawai murni dari database (gelar depan/belakang hanya jika ada, tanpa mengarang gelar)
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

// Bentuk URL Tanda Tangan Digital dari Auth-BPOM
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

// Normalisasi log database menjadi format record tampilan
export const mapLogToRecord = (log: any): MaintenanceRecord => {
  const started = log.started_at ? new Date(log.started_at) : new Date();
  const finished = log.finished_at ? new Date(log.finished_at) : null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr =
    log.date ||
    `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())}`;
  const startStr =
    log.startTime || `${pad(started.getHours())}:${pad(started.getMinutes())}`;
  const endStr =
    log.endTime ||
    (finished ? `${pad(finished.getHours())}:${pad(finished.getMinutes())}` : "-");

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

// Normalisasi sesi aktif berjalan dari database
export const mapActiveSession = (sess: any): ActiveMaintenanceSession => {
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

// Status Dinamis Aset Berdasarkan Jenis Kegiatan
export const getActivityDynamicStatus = (
  type: MaintenanceRecord["activityType"]
): string => {
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
};

// Badge Jenis Kegiatan
export const getActivityBadge = (type: MaintenanceRecord["activityType"]) => {
  switch (type) {
    case "warming_up":
      return {
        label: "Pemanasan Rutin",
        color: "text-amber-800 bg-amber-50 border-amber-200",
      };
    case "emergency_run":
      return {
        label: "Darurat (PLN Padam)",
        color: "text-rose-800 bg-rose-50 border-rose-300 font-bold",
      };
    case "routine_service":
      return {
        label: "Servis Berkala",
        color: "text-blue-800 bg-blue-50 border-blue-200",
      };
    case "fuel_refill":
      return {
        label: "Pengisian Solar",
        color: "text-purple-800 bg-purple-50 border-purple-200",
      };
    case "load_test":
      return {
        label: "Uji Beban",
        color: "text-indigo-800 bg-indigo-50 border-indigo-200",
      };
    case "repair":
      return {
        label: "Perbaikan / Troubleshoot",
        color: "text-rose-800 bg-rose-50 border-rose-200",
      };
    default:
      return {
        label: "Pemeliharaan",
        color: "text-slate-700 bg-slate-100 border-slate-200",
      };
  }
};

// Format Tanggal YYYY-MM-DD -> DD-MM-YYYY
export const formatDateDisplay = (dateStr: string): string => {
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

// Kompresi Foto Kamera / File Upload sebelum disimpan
export const compressAndReadPhotoFile = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (url: string) => void,
  onError: (msg: string) => void
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 12 * 1024 * 1024) {
    onError("⚠️ Ukuran foto terlalu besar (maksimal 12MB).");
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

