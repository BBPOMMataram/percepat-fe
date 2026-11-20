import { getAuthStorageUrl } from "@/utils/userPhoto";

export type ChecklistStatus = "ya" | "tidak" | "na";

export interface ChecklistItem {
    key: string;
    name: string;
    criteria: string;
    note?: string;
}

export interface ChecklistSection {
    title: string;
    items: ChecklistItem[];
}

export interface ChecklistAnswer {
    status?: ChecklistStatus;
    note?: string;
}

export interface PengendalianMutuRecord {
    id: string;
    createdAt: string;
    tanggalPengujian: string;
    jenisSampel: string[];
    parameterPengujian: string;
    metodePengujian: "molekuler" | "kultur";
    statusAkhir: "valid" | "invalid";
    checklist: Record<string, ChecklistAnswer>;
    catatanEvaluasi: string;
    penyelia?: "IGM Aryama Jelantik, S.Si" | "Haryoudi Valorischa, S.Si";
    pengujiNama?: string;
    pengujiSignaturePath?: string;
}

export const SUPERVISORS = [
    "IGM Aryama Jelantik, S.Si",
    "Haryoudi Valorischa, S.Si",
] as const;

export const SAMPLE_TYPES = ["Pangan", "Kosmetika", "Obat", "Obat Bahan Pangan"];

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
    {
        title: "Tahap Awal: Monitoring",
        items: [
            { key: "monitoring_area", name: "Monitoring Area Kerja", criteria: "Cawan paparan udara (air settling plate) di LAF dan BSC menunjukkan < 15 CFU/cawan.", note: "Dilakukan setiap 3 bulan sekali" },
            { key: "monitoring_ruangan", name: "Monitoring Ruangan Kerja", criteria: "Cawan paparan udara (air settling plate) dan/atau uji usap (swab test) permukaan ruangan steril/bersih memenuhi batas mikroba sesuai kelas kebersihan ruang.", note: "Dilakukan setiap 6 bulan sekali" },
            { key: "monitoring_oven_inkubator", name: "Monitoring oven dan inkubator", criteria: "Suhu oven (sterilisasi kering) dan inkubator terpantau dan sesuai rentang spesifikasi metode uji (misalnya inkubator 35 ± 1 °C atau 37 ± 1 °C; oven 160–180 °C) dengan termometer terkalibrasi.", note: "Dilakukan setiap digunakan" },
            { key: "monitoring_autoklaf", name: "Monitoring Autoklaf", criteria: "Indikator biologi (spora Geobacillus stearothermophilus) dan/atau indikator kimia (autoclave tape) menunjukkan sterilisasi efektif." , note: "Dilakukan setiap 3 bulan sekali" },
            { key: "monitoring_kultur", name: "Monitoring Kultur Bakteri", criteria: "Kultur murni, morfologi koloni dan pewarnaan Gram sesuai karakteristik strain acuan (CRM/ATCC), reaksi biokimia sesuai spesifikasi, viabilitas baik, serta jumlah subkultur tidak melebihi 5 pasase.", note: "Dilakukan setiap bulan sekali" },
            { key: "monitoring_aquadest", name: "Monitoring Aquadest Media", criteria: "Parameter kimia dan mikrobiologi aquadest memenuhi syarat (pH 5,0–7,5, konduktivitas < 5 µS/cm, bebas zat penghambat pertumbuhan mikroba, dan TPC < 10 CFU/mL).", note: "Dilakukan setiap 6 bulan sekali" },
            { key: "gpt_media", name: "GPT (Growth Promotion Test) Media", criteria: "Media selektif/non-selektif mendukung pertumbuhan mikroba target (Productivity Ratio > 0,5 atau sesuai standar ISO 11133) dan menghambat mikroba non-target.", note: "Dilakukan setiap media dengan batch baru" },
        ],
    },
    {
        title: "Tahap 1: Pre-Analitik (Persiapan & Sterilitas)",
        items: [
            { key: "identitas_sampel", name: "Kondisi & Identitas Sampel", criteria: "Kemasan utuh, label jelas, suhu penerimaan sampel sesuai syarat penyimpanan." },
            { key: "lingkungan_kerja", name: "Kondisi Lingkungan Kerja", criteria: "Pencatatan suhu dan kelembaban udara." },
            { key: "area_kerja", name: "Kesiapan Area Kerja (LAF)", criteria: "Area kerja didisinfeksi, lampu UV dinyalakan minimal 30 menit sebelum penggunaan." },
            { key: "peralatan", name: "Kesiapan Peralatan", criteria: "Autoklaf, inkubator, pipet, dan thermal cycler dalam status terkalibrasi/terverifikasi." },
            { key: "media_reagen", name: "Kesiapan Media & Reagen", criteria: "Media steril, tidak kedaluwarsa, tidak ada perubahan warna. Reagen PCR disimpan pada suhu -20 °C." },
        ],
    },
    {
        title: "Tahap 2: Analitik (Metode Kultur / Konvensional)",
        items: [
            { key: "homogenisasi", name: "Homogenisasi Sampel", criteria: "Penimbangan sesuai metode secara aseptis, pengenceran awal (1:9) di-vortex / di-stomacher hingga homogen." },
            { key: "suhu_media", name: "Suhu Penuangan Media (Kultur)", criteria: "Suhu media agar cair dipastikan 44–46 °C saat dituangkan ke cawan petri." },
            { key: "kontrol_media", name: "Kontrol Sterilitas Media & Blanko", criteria: "Blanko larutan pengencer dan blanko media agar cair tidak menunjukkan pertumbuhan koloni (0 CFU)." },
            { key: "inkubasi", name: "Inkubasi Uji Utama", criteria: "Cawan/tabung diinkubasi posisi terbalik, suhu inkubator dan waktu sesuai metode uji." },
            { key: "kontrol_pcr", name: "Kontrol PCR & Ekstraksi (Molekuler)", criteria: "Memasukkan Kontrol Positif, Kontrol Negatif (NTC), dan Kontrol Ekstraksi pada running RTi-PCR." },
        ],
    },
    {
        title: "Tahap 3: Uji Konfirmasi Lanjutan (Identifikasi Spesifik)",
        items: [
            { key: "kualitas_dna", name: "Ekstraksi & Kualitas DNA", criteria: "Konsentrasi DNA memadai, kemurnian DNA memenuhi rasio A260/A280 = 1,8–2,0." },
            { key: "kontrol_rtipcr", name: "Penggunaan Kontrol RTi-PCR", criteria: "Memasukkan Kontrol Positif, Kontrol Negatif (NTC), dan Kontrol Ekstraksi pada running." },
            { key: "program_amplifikasi", name: "Program Amplifikasi", criteria: "Profil suhu dan jumlah siklus thermal cycler sesuai dengan SOP/Metode Analisis." },
            { key: "seleksi_koloni", name: "Seleksi Koloni / Target Uji", criteria: "Kultur: koloni dihitung pada rentang valid (25–250 / 30–300 CFU) dan duplo presisi. PCR: kontrol positif mengalami amplifikasi, NTC tidak mengalami amplifikasi (flat)." },
            { key: "reagen_konfirmasi", name: "Kesiapan Reagen Uji Konfirmasi", criteria: "Dilakukan uji biokimia/morfologi spesifik (misalnya uji Koagulase / Melting Curve Tm)." },
            { key: "morfologi_pewarnaan", name: "Uji Morfologi & Pewarnaan (Kultur)", criteria: "Perhitungan rerata dikali faktor pengenceran, pembulatan sesuai aturan baku (2 angka signifikan)." },
            { key: "biokimia", name: "Uji Biokimia / Fisiologis (Kultur)", criteria: "Raw data (file PCR / lembar kerja fisik) di-backup/diarsipkan secara sistematis." },
            { key: "konfirmasi_molekuler", name: "Uji Konfirmasi Molekuler (PCR)", criteria: "Sisa sampel & cawan diautoklaf (dekontaminasi), meja kerja dibersihkan pasca pengujian." },
            { key: "kontrol_konfirmasi", name: "Penggunaan Kontrol Konfirmasi", criteria: "Kontrol Positif dan Kontrol Negatif Uji Konfirmasi menunjukkan reaksi yang valid/sesuai standar." },
        ],
    },
    {
        title: "Tahap 4: Post-Analitik (Interpretasi & Dokumentasi)",
        items: [
            { key: "rekapitulasi", name: "Pembacaan Hasil & Rekapitulasi", criteria: "Hasil perhitungan koloni (rentang 25–250 / 30–300 CFU) disesuaikan dengan hasil uji konfirmasi positif." },
            { key: "pelaporan", name: "Pelaporan & Pembulatan", criteria: "Perhitungan rerata dikali faktor pengenceran, pembulatan sesuai aturan baku." },
            { key: "raw_data", name: "Ketertelusuran Raw Data", criteria: "Raw data (foto cawan, hasil uji biokimia, file PCR/LKP) di-backup/diarsipkan secara sistematis." },
            { key: "limbah_sanitasi", name: "Penanganan Limbah & Sanitasi", criteria: "Sisa isolat uji & media diautoklaf (dekontaminasi), area kerja dibersihkan pasca konfirmasi." },
        ],
    },
];

const STORAGE_KEY = "pengujian-pengendalian-mutu-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPengendalianMutuRecord(value: unknown): value is PengendalianMutuRecord {
    if (!isRecord(value)) return false;
    return typeof value.id === "string"
        && typeof value.createdAt === "string"
        && typeof value.tanggalPengujian === "string"
        && Array.isArray(value.jenisSampel)
        && value.jenisSampel.every((item) => typeof item === "string")
        && typeof value.parameterPengujian === "string"
        && (value.metodePengujian === "molekuler" || value.metodePengujian === "kultur")
        && (value.statusAkhir === "valid" || value.statusAkhir === "invalid")
        && isRecord(value.checklist)
        && typeof value.catatanEvaluasi === "string"
        && (value.penyelia === undefined || SUPERVISORS.includes(value.penyelia as typeof SUPERVISORS[number]))
        && (value.pengujiNama === undefined || typeof value.pengujiNama === "string")
        && (value.pengujiSignaturePath === undefined || typeof value.pengujiSignaturePath === "string");
}

export function readPengendalianMutuRecords(): PengendalianMutuRecord[] {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isPengendalianMutuRecord)) {
        throw new Error("Data checklist lokal tidak valid. Hapus data browser untuk memulai kembali.");
    }

    return parsed;
}

export function savePengendalianMutuRecord(record: PengendalianMutuRecord): void {
    const records = readPengendalianMutuRecords();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...records]));
}

export function getSignatureUrl(signaturePath: string | null | undefined): string | null {
    if (!signaturePath) return null;
    const trimmed = signaturePath.trim();
    if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") return null;
    return getAuthStorageUrl(trimmed);
}
