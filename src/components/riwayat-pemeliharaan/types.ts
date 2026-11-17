// Tipe Data Log Pemeliharaan Fisik BMN
export interface MaintenanceRecord {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  activityType:
    | "warming_up"
    | "module_check"
    | "emergency_run"
    | "routine_service"
    | "fuel_refill"
    | "load_test"
    | "repair"
    | "other";
  activityDetails?: string;
  userId?: string | number | null;
  executorName: string;
  executorRole?: string;
  executorNip?: string | null;
  executorSignatureUrl?: string | null;
  verifierName: string;
  verifierSignatureUrl?: string | null;
  isVerified: boolean;
  verifiedAt?: string;
  statusAfter: "standby" | "trouble" | "need_followup";
  notes?: string;
  initialPhotoUrl?: string;
  finalPhotoUrl?: string;
  initialPhotos: string[];
  finalPhotos: string[];
}

// Sesi Kegiatan yang Sedang Berjalan (Active Check-in)
export interface ActiveMaintenanceSession {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  startTimeDisplay: string;
  startTimestamp: number;
  activityType: MaintenanceRecord["activityType"];
  activityDetails: string;
  userId?: string | number | null;
  executorName: string;
  executorRole: string;
  executorNip?: string | null;
  initialPhotoUrl?: string;
  initialPhotos: string[];
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

// Metadata Profil Aset Fisik
export interface AssetMetadata {
  id: number;
  barang_id?: number | null;
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

// Item Master Barang dari tabel barangs di SIMPEL BMN
export interface MasterBarangItem {
  id: number;
  kode: string;
  nup: number | string;
  nama: string;
  merk?: string;
  tipe?: string;
  kondisi?: string;
  lokasi?: string;
  asset_code: string;
  display_name: string;
  category: string;
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

export interface AccessDeniedInfo {
  userName: string;
  userRole: string;
  userNip: string;
}

export interface PhotoGalleryPreview {
  urls: string[];
  initialIndex: number;
  caption: string;
}
