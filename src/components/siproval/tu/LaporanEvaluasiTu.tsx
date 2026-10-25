"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/utils/api";

const baseUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL_SIPROVAL || "http://localhost:8000";

type ReportRow = {
  no: number;
  kode_ro: string;
  nama_ro: string;
  volume: {
    target_raw: number;
    target_formatted: string;
    realisasi_raw: number;
    realisasi_formatted: string;
    capaian_raw: number;
    capaian_formatted: string;
  };
  anggaran: {
    pagu_raw: number;
    pagu_formatted: string;
    realisasi_raw: number;
    realisasi_formatted: string;
    capaian_raw: number;
    capaian_formatted: string;
  };
};

type ReportSummary = {
  total_output: number;
  total_pagu_raw: number;
  total_pagu_formatted: string;
  total_realisasi_raw: number;
  total_realisasi_formatted: string;
  total_capaian_anggaran_raw: number;
  total_capaian_anggaran_formatted: string;
};

type MonthData = {
  month_key: string;
  month_label: string;
  short: string;
  budget_tab_id?: number;
  budget_tab_title?: string;
  ro_spreadsheet?: string;
  ro_tab?: string;
  rows: ReportRow[];
  summary: ReportSummary;
};

type RapkReportRow = {
  no: number | string;
  sasaran_strategis: string;
  nama_indikator: string;
  volume: {
    target_2029: string;
    target_2026: string;
    target_tw: string;
    realisasi: string;
    capaian_tw: string;
    capaian_2026: string;
    capaian_2029: string;
  };
  anggaran: {
    pagu_raw: number;
    pagu_formatted: string;
    realisasi_raw: number;
    realisasi_formatted: string;
    capaian_raw: number;
    capaian_formatted: string;
  };
};

type RapkMonthData = {
  month_key: string;
  month_label: string;
  rows: RapkReportRow[];
  summary: {
    total_pagu_formatted: string;
    total_realisasi_formatted: string;
    total_capaian_anggaran_formatted: string;
  };
};

type MatriksRekomendasiRow = {
  id: number;
  year?: number;
  quarter?: string;
  no: number;
  indikator: string;
  kendala: string | null;
  rekomendasi: string | null;
  rencana_tindak_lanjut: string | null;
  timeline: string | null;
  is_risiko: string | null;
  kode_resiko: string | null;
  peristiwa_resiko: string | null;
  progres_selesai?: string | null;
  progres_belum?: string | null;
};

type QuarterOption = {
  key: string;
  name: string;
  label: string;
  short: string;
  end_month: string;
  months: string[];
  header_month_year: string;
  periode_text: string;
  section_title: string;
};

type ReportSources = {
  volume_spreadsheet: string;
  volume_tab: string;
  anggaran_spreadsheet: string;
  anggaran_tab: string;
};

export default function LaporanEvaluasiTu() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parameter from URL: either ?quarter=TW2 or ?month=JUNI
  const paramQuarter = searchParams.get("quarter")?.toUpperCase();
  const paramMonth = searchParams.get("month")?.toUpperCase();

  const resolveInitialQuarter = () => {
    if (paramQuarter && ["TW1", "TW2", "TW3", "TW4"].includes(paramQuarter)) {
      return paramQuarter;
    }
    if (paramMonth) {
      if (["JANUARI", "FEBRUARI", "MARET"].includes(paramMonth)) return "TW1";
      if (["APRIL", "MEI", "JUNI"].includes(paramMonth)) return "TW2";
      if (["JULI", "AGUSTUS", "SEPTEMBER"].includes(paramMonth)) return "TW3";
      if (["OKTOBER", "NOVEMBER", "DESEMBER"].includes(paramMonth)) return "TW4";
    }
    return "TW2";
  };

  type LampiranFoto = {
    id: string;
    file: File | null;
    previewUrl: string;
    caption: string;
  };

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const availableYears = [2026];
  const [lampiranFotos, setLampiranFotos] = useState<LampiranFoto[]>([]);
  const [showLampiranConfig, setShowLampiranConfig] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;
    const newItems: LampiranFoto[] = Array.from(files).map((f, i) => ({
      id: `${Date.now()}_${i}_${Math.random()}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      caption: `Dokumentasi Kegiatan Evaluasi Internal Triwulan ${selectedQuarter} ${selectedYear}`,
    }));
    setLampiranFotos((prev) => [...prev, ...newItems]);
  };

  const handleUpdateCaption = (id: string, caption: string) => {
    setLampiranFotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item))
    );
  };

  const handleRemovePhoto = (id: string) => {
    setLampiranFotos((prev) => prev.filter((item) => item.id !== id));
  };

  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    resolveInitialQuarter()
  );

  const [availableQuarters, setAvailableQuarters] = useState<QuarterOption[]>([
    {
      key: "TW1",
      name: "Triwulan I",
      label: "Triwulan I (Januari - Maret 2026)",
      short: "TW I (Jan-Mar)",
      end_month: "MARET",
      months: ["JANUARI", "FEBRUARI", "MARET"],
      header_month_year: "MARET TAHUN 2026",
      periode_text: "Januari sampai dengan Maret 2026",
      section_title:
        "Capaian Kinerja dan Realisasi Anggaran per Output perbulan Sampai Maret Tahun 2026",
    },
    {
      key: "TW2",
      name: "Triwulan II",
      label: "Triwulan II (April - Juni 2026)",
      short: "TW II (Apr-Jun)",
      end_month: "JUNI",
      months: ["APRIL", "MEI", "JUNI"],
      header_month_year: "JUNI TAHUN 2026",
      periode_text: "April sampai dengan Juni 2026",
      section_title:
        "Capaian Kinerja dan Realisasi Anggaran per Output perbulan Sampai Juni Tahun 2026",
    },
    {
      key: "TW3",
      name: "Triwulan III",
      label: "Triwulan III (Juli - September 2026)",
      short: "TW III (Jul-Sep)",
      end_month: "SEPTEMBER",
      months: ["JULI", "AGUSTUS", "SEPTEMBER"],
      header_month_year: "SEPTEMBER TAHUN 2026",
      periode_text: "Juli sampai dengan September 2026",
      section_title:
        "Capaian Kinerja dan Realisasi Anggaran per Output perbulan Sampai September Tahun 2026",
    },
    {
      key: "TW4",
      name: "Triwulan IV",
      label: "Triwulan IV (Oktober - Desember 2026)",
      short: "TW IV (Okt-Des)",
      end_month: "DESEMBER",
      months: ["OKTOBER", "NOVEMBER", "DESEMBER"],
      header_month_year: "DESEMBER TAHUN 2026",
      periode_text: "Oktober sampai dengan Desember 2026",
      section_title:
        "Capaian Kinerja dan Realisasi Anggaran per Output perbulan Sampai Desember Tahun 2026",
    },
  ]);

  const [quarterLabel, setQuarterLabel] = useState<string>(
    "Triwulan II (April - Juni 2026)"
  );
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [matriksRekomendasi, setMatriksRekomendasi] = useState<
    MatriksRekomendasiRow[]
  >([]);
  const [matriksTitle, setMatriksTitle] = useState<string>(
    "Matriks Rekomendasi Triwulan TW II 2026"
  );
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [sources, setSources] = useState<ReportSources>({
    volume_spreadsheet: "Realisasi RO 2026",
    volume_tab: "Realisasi RO (Tab 155)",
    anggaran_spreadsheet: "Maping Anggaran 2026",
    anggaran_tab: "April, Mei, Juni 2026",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Editable Berita Acara Metadata matching the template screenshot
  const [baHeaderMonthYear, setBaHeaderMonthYear] = useState("JUNI TAHUN 2026");
  const [baOpeningText, setBaOpeningText] = useState(
    "Pada hari ini rabu, tanggal Lima Belas Juli Tahun Dua Ribu Dua Puluh Enam, bertempat di Balai Besar POM di Mataram, kami yang bertandatangan dibawah ini :"
  );
  const [pihak1Nama, setPihak1Nama] = useState("Yogi Abaso Mataram, S.Si, Apt");
  const [pihak1Nip, setPihak1Nip] = useState("19810124 200912 1 002");
  const [pihak1Jabatan, setPihak1Jabatan] = useState(
    "Kepala Balai Besar POM di Mataram"
  );
  const [pihak2Nama, setPihak2Nama] = useState("Basuki Murdi Hartono, SH");
  const [pihak2Nip, setPihak2Nip] = useState("19790405 200501 1 002");
  const [pihak2Jabatan, setPihak2Jabatan] = useState(
    "Ketua Tim Evaluasi Internal"
  );
  const [periodeText, setPeriodeText] = useState("April sampai dengan Juni 2026");
  const [sectionTitle, setSectionTitle] = useState(
    "Capaian Kinerja dan Realisasi Anggaran per Output perbulan Sampai Juni Tahun 2026"
  );
  const [rapkMonthsData, setRapkMonthsData] = useState<RapkMonthData[]>([]);
  const [rapkSectionTitle, setRapkSectionTitle] = useState(
    "Capaian Rencana Aksi Perjanjian Kinerja dan Realisasi Anggaran per bulan Sampai Juni Tahun 2026"
  );

  const printAreaRef = useRef<HTMLDivElement>(null);

  const fetchReport = async (quarterKey: string) => {
    setLoading(true);
    setError("");
    try {
      const query = user?.id
        ? `?quarter=${encodeURIComponent(quarterKey)}&user_id=${encodeURIComponent(String(user.id))}`
        : `?quarter=${encodeURIComponent(quarterKey)}`;
      const res = await api.get(
        `${baseUrl}/api/tu/laporan-evaluasi/${selectedYear}${query}`
      );

      if (res.data?.data) {
        const d = res.data.data;
        const mData: MonthData[] = d.months_data || [];
        setMonthsData(mData);
        setQuarterLabel(d.quarter_label || d.month_label || "");

        if (Array.isArray(d.rapk_months_data)) {
          setRapkMonthsData(d.rapk_months_data);
        }
        if (d.rapk_section_title) {
          setRapkSectionTitle(d.rapk_section_title);
        }

        if (Array.isArray(d.matriks_rekomendasi)) {
          setMatriksRekomendasi(d.matriks_rekomendasi);
        }
        if (d.matriks_rekomendasi_title) {
          setMatriksTitle(d.matriks_rekomendasi_title);
        }

        if (Array.isArray(d.available_quarters) && d.available_quarters.length > 0) {
          setAvailableQuarters(d.available_quarters);
        }

        if (d.summary) {
          setSummary(d.summary);
        }

        if (d.sources) {
          setSources(d.sources);
        }

        // Auto-update text defaults based on active quarter
        if (d.header_month_year) {
          setBaHeaderMonthYear(d.header_month_year);
        }
        if (d.periode_text) {
          setPeriodeText(d.periode_text);
        }
        if (d.section_title) {
          setSectionTitle(d.section_title);
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(
        e.response?.data?.message ||
          "Gagal memuat data laporan evaluasi dari Realisasi RO dan Budget Mapping."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchReport(selectedQuarter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedQuarter, selectedYear, user?.id]);

  const handleSelectQuarter = (qKey: string) => {
    setSelectedQuarter(qKey);
    const qObj = availableQuarters.find((q) => q.key === qKey);
    if (qObj) {
      setBaHeaderMonthYear(qObj.header_month_year);
      setPeriodeText(qObj.periode_text);
      setSectionTitle(qObj.section_title);
      setMatriksTitle(`Matriks Rekomendasi Triwulan ${qObj.name} 2026`);
    }
    router.replace(`/siproval/tu/laporan-evaluasi?quarter=${qKey}`);
  };

  // Build HTML string for Word / Excel export containing all 3 months of Section 1 + Section 2 Matriks Rekomendasi
  const buildDocumentHtml = (forExcel = false) => {
    const monthsTablesHtml = monthsData
      .map(
        (m, mIdx) => `
        <div style="font-weight:bold; font-size:11pt; margin-top:${mIdx > 0 ? "24px" : "8px"}; margin-bottom:6px;">
          ${m.month_label}
        </div>
        <table class="ba-table" ${forExcel ? 'border="1"' : ""}>
          <thead>
            <tr>
              <th rowspan="2" class="header-cell" style="width:38px;">No.</th>
              <th rowspan="2" colspan="2" class="header-cell">Program/Kegiatan/Ouput</th>
              <th colspan="3" class="header-cell">Volume</th>
              <th colspan="3" class="header-cell">Anggaran</th>
            </tr>
            <tr>
              <th class="header-cell" style="width:82px;">Target 2026</th>
              <th class="header-cell" style="width:78px;">Realisasi</th>
              <th class="header-cell" style="width:96px;">Capaian/<br/>Progress (%)</th>
              <th class="header-cell" style="width:115px;">Pagu awal (Rp)</th>
              <th class="header-cell" style="width:115px;">Realisasi (Rp)</th>
              <th class="header-cell" style="width:92px;">Capaian (%)</th>
            </tr>
            <tr>
              <th class="sub-code-cell">a</th>
              <th colspan="2" class="sub-code-cell">b</th>
              <th class="sub-code-cell">c</th>
              <th class="sub-code-cell">d</th>
              <th class="sub-code-cell">e= (d/c*100)</th>
              <th class="sub-code-cell">f</th>
              <th class="sub-code-cell">g</th>
              <th class="sub-code-cell">h= (g/f*100)</th>
            </tr>
          </thead>
          <tbody>
            ${m.rows
              .map(
                (r) => `
              <tr>
                <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:middle;">${r.no}</td>
                <td style="border:1px solid #000; padding:4px 6px; text-align:left; vertical-align:middle; white-space:nowrap;">${r.kode_ro}</td>
                <td style="border:1px solid #000; padding:4px 8px; text-align:left; vertical-align:middle;">${r.nama_ro}</td>
                <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:middle;">${r.volume.target_formatted}</td>
                <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:middle;">${r.volume.realisasi_formatted}</td>
                <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:middle;">${r.volume.capaian_formatted}</td>
                <td style="border:1px solid #000; padding:4px 8px; text-align:center; vertical-align:middle;">${r.anggaran.pagu_formatted}</td>
                <td style="border:1px solid #000; padding:4px 8px; text-align:center; vertical-align:middle;">${r.anggaran.realisasi_formatted}</td>
                <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:middle;">${r.anggaran.capaian_formatted}</td>
              </tr>`
              )
              .join("")}
            ${
              m.summary
                ? `
              <tr style="background-color:#bdd7ee; font-weight:bold;">
                <td colspan="3" style="border:1px solid #000; padding:5px 6px; text-align:center;">JUMLAH</td>
                <td style="border:1px solid #000; padding:5px 6px; text-align:center;">-</td>
                <td style="border:1px solid #000; padding:5px 6px; text-align:center;">-</td>
                <td style="border:1px solid #000; padding:5px 6px; text-align:center;">-</td>
                <td style="border:1px solid #000; padding:5px 8px; text-align:center;">${m.summary.total_pagu_formatted}</td>
                <td style="border:1px solid #000; padding:5px 8px; text-align:center;">${m.summary.total_realisasi_formatted}</td>
                <td style="border:1px solid #000; padding:5px 6px; text-align:center;">${m.summary.total_capaian_anggaran_formatted}%</td>
              </tr>`
                : ""
            }
          </tbody>
        </table>
      `
      )
      .join("");

    const matriksHtml = `
      <div style="font-size:11pt; margin-top:28px; margin-bottom:8px;">
        2.&nbsp;&nbsp;&nbsp;&nbsp;${matriksTitle}
      </div>
      <table class="ba-table" ${forExcel ? 'border="1"' : ""}>
        <thead>
          <tr>
            <th class="matriks-header-cell" style="width:36px;">No.</th>
            <th class="matriks-header-cell" style="width:160px;">Indikator</th>
            <th class="matriks-header-cell" style="width:200px;">Kendala / Permasalahan</th>
            <th class="matriks-header-cell" style="width:200px;">Rekomendasi</th>
            <th class="matriks-header-cell" style="width:200px;">Rencana Tindak Lanjut</th>
            <th class="matriks-header-cell" style="width:75px;">Timeline</th>
            <th class="matriks-header-cell" style="width:85px;">Apakah Sudah dikelola sebagai risiko (Y/T)</th>
            <th class="matriks-header-cell" style="width:65px;">Kode Resiko</th>
            <th class="matriks-header-cell" style="width:170px;">Peristiwa Resiko</th>
          </tr>
        </thead>
        <tbody>
          ${matriksRekomendasi
            .map((item) => {
              const isY = item.is_risiko === "Y" || item.is_risiko === "Ya";
              const kode = isY ? (item.kode_resiko || "-") : "-";
              const peristiwa = isY ? (item.peristiwa_resiko || "-") : "-";
              return `
            <tr>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:top;">${item.no}</td>
              <td style="border:1px solid #000; padding:4px 8px; text-align:left; vertical-align:top; font-weight:bold;">${item.indikator}</td>
              <td style="border:1px solid #000; padding:4px 8px; text-align:left; vertical-align:top; white-space:pre-line;">${item.kendala || "-"}</td>
              <td style="border:1px solid #000; padding:4px 8px; text-align:left; vertical-align:top; white-space:pre-line;">${item.rekomendasi || "-"}</td>
              <td style="border:1px solid #000; padding:4px 8px; text-align:left; vertical-align:top; white-space:pre-line;">${item.rencana_tindak_lanjut || "-"}</td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:top; white-space:nowrap;">${item.timeline || "-"}</td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:top; font-weight:bold;">${isY ? "Y" : "T"}</td>
              <td style="border:1px solid #000; padding:4px 6px; text-align:center; vertical-align:top;">${kode}</td>
              <td style="border:1px solid #000; padding:4px 8px; text-align:left; vertical-align:top; white-space:pre-line;">${peristiwa}</td>
            </tr>
          `;
            })
            .join("")}
        </tbody>
      </table>
    `;

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>Berita Acara Evaluasi Internal - ${quarterLabel}</title>
        <style>
          @page {
            size: 29.7cm 21cm;
            margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          }
          body {
            font-family: Calibri, Arial, sans-serif;
            font-size: 11pt;
            color: #000000;
            line-height: 1.35;
          }
          table.ba-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-bottom: 16px;
          }
          .header-cell {
            background-color: #bdd7ee;
            border: 1px solid #000000;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            padding: 5px 6px;
          }
          .matriks-header-cell {
            background-color: #ffc000;
            border: 1px solid #000000;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            padding: 5px 6px;
            color: #000000;
          }
          .sub-code-cell {
            background-color: #bdd7ee;
            border: 1px solid #000000;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            padding: 3px 6px;
            font-size: 9.5pt;
          }
        </style>
      </head>
      <body>
        <div style="text-align:center; font-weight:normal; margin-bottom:16px;">
          <div style="font-size:11pt;">BERITA ACARA EVALUASI INTERNAL</div>
          <div style="font-size:11pt;">BALAI BESAR POM DI MATARAM</div>
          <div style="font-size:11pt;">${baHeaderMonthYear}</div>
        </div>

        <p style="margin:0 0 8px 0;">${baOpeningText}</p>

        <table style="border:none; border-collapse:collapse; margin-bottom:10px; font-size:11pt;">
          <tr>
            <td style="width:28px; vertical-align:top;">1.</td>
            <td style="width:90px; vertical-align:top;">Nama</td>
            <td style="width:14px; vertical-align:top;">:</td>
            <td style="vertical-align:top;">${pihak1Nama}</td>
          </tr>
          <tr>
            <td></td>
            <td style="vertical-align:top;">NIP</td>
            <td style="vertical-align:top;">:</td>
            <td style="vertical-align:top;">${pihak1Nip}</td>
          </tr>
          <tr>
            <td></td>
            <td style="vertical-align:top;">Jabatan</td>
            <td style="vertical-align:top;">:</td>
            <td style="vertical-align:top;">${pihak1Jabatan}</td>
          </tr>
          <tr><td colspan="4" style="height:8px;"></td></tr>
          <tr>
            <td style="vertical-align:top;">2.</td>
            <td style="vertical-align:top;">Nama</td>
            <td style="vertical-align:top;">:</td>
            <td style="vertical-align:top;">${pihak2Nama}</td>
          </tr>
          <tr>
            <td></td>
            <td style="vertical-align:top;">NIP</td>
            <td style="vertical-align:top;">:</td>
            <td style="vertical-align:top;">${pihak2Nip}</td>
          </tr>
          <tr>
            <td></td>
            <td style="vertical-align:top;">Jabatan</td>
            <td style="vertical-align:top;">:</td>
            <td style="vertical-align:top;">${pihak2Jabatan}</td>
          </tr>
        </table>

        <p style="margin:10px 0 12px 0;">
          Telah melaksanakan evaluasi internal terhadap realisasi anggaran dan capaian kinerja pada Balai Besar POM di Mataram periode ${periodeText} dengan hasil sebagai berikut :
        </p>

        <div style="margin-bottom:8px;">
          <div>1.&nbsp;&nbsp;&nbsp;&nbsp;${sectionTitle}</div>
        </div>

        ${monthsTablesHtml}

        ${matriksRekomendasi.length > 0 ? matriksHtml : ""}
      </body>
      </html>
    `;
  };

  const handleExportWord = () => {
    const html = buildDocumentHtml(false);
    const blob = new Blob(["\ufeff", html], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Berita_Acara_Evaluasi_Internal_${selectedQuarter}_${selectedYear}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const html = buildDocumentHtml(true);
    const blob = new Blob(["\ufeff", html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Evaluasi_Internal_TU_${selectedQuarter}_${selectedYear}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;
    let y = 14;

    // Header Title (Centered)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.text("BERITA ACARA EVALUASI INTERNAL", pageWidth / 2, y, {
      align: "center",
    });
    y += 5;
    doc.text("BALAI BESAR POM DI MATARAM", pageWidth / 2, y, {
      align: "center",
    });
    y += 5;
    doc.text(baHeaderMonthYear.toUpperCase(), pageWidth / 2, y, {
      align: "center",
    });
    y += 8;

    // Opening Text
    doc.setFontSize(9.5);
    const openingLines = doc.splitTextToSize(baOpeningText, contentWidth);
    doc.text(openingLines, marginX, y);
    y += openingLines.length * 4.5 + 1.5;

    // Signatory 1
    const labelX = marginX + 8;
    const colonX = marginX + 28;
    const valueX = marginX + 32;

    doc.text("1.", marginX, y);
    doc.text("Nama", labelX, y);
    doc.text(":", colonX, y);
    doc.text(pihak1Nama, valueX, y);
    y += 4.5;

    doc.text("NIP", labelX, y);
    doc.text(":", colonX, y);
    doc.text(pihak1Nip, valueX, y);
    y += 4.5;

    doc.text("Jabatan", labelX, y);
    doc.text(":", colonX, y);
    doc.text(pihak1Jabatan, valueX, y);
    y += 6.5;

    // Signatory 2
    doc.text("2.", marginX, y);
    doc.text("Nama", labelX, y);
    doc.text(":", colonX, y);
    doc.text(pihak2Nama, valueX, y);
    y += 4.5;

    doc.text("NIP", labelX, y);
    doc.text(":", colonX, y);
    doc.text(pihak2Nip, valueX, y);
    y += 4.5;

    doc.text("Jabatan", labelX, y);
    doc.text(":", colonX, y);
    doc.text(pihak2Jabatan, valueX, y);
    y += 7;

    // Evaluation Statement
    const evalStatement = `Telah melaksanakan evaluasi internal terhadap realisasi anggaran dan capaian kinerja pada Balai Besar POM di Mataram periode ${periodeText} dengan hasil sebagai berikut :`;
    const evalLines = doc.splitTextToSize(evalStatement, contentWidth);
    doc.text(evalLines, marginX, y);
    y += evalLines.length * 4.5 + 2;

    // Section 1 Heading
    doc.text("1.", marginX, y);
    doc.text(sectionTitle, labelX, y);
    y += 6;

    // Loop through each of the 3 months in Section 1
    monthsData.forEach((m, mIdx) => {
      if (mIdx > 0) {
        doc.addPage();
        y = 14;
      }

      // Month Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(m.month_label, marginX, y);
      doc.setFont("helvetica", "normal");
      y += 3;

      const bodyRows: any[] = m.rows.map((r) => [
        r.no,
        r.kode_ro,
        r.nama_ro,
        r.volume.target_formatted,
        r.volume.realisasi_formatted,
        r.volume.capaian_formatted,
        r.anggaran.pagu_formatted,
        r.anggaran.realisasi_formatted,
        r.anggaran.capaian_formatted,
      ]);

      if (m.summary) {
        bodyRows.push([
          {
            content: "JUMLAH",
            colSpan: 3,
            styles: { halign: "center", fontStyle: "bold" },
          },
          { content: "-", styles: { halign: "center" } },
          { content: "-", styles: { halign: "center" } },
          { content: "-", styles: { halign: "center" } },
          {
            content: m.summary.total_pagu_formatted,
            styles: { halign: "center", fontStyle: "bold" },
          },
          {
            content: m.summary.total_realisasi_formatted,
            styles: { halign: "center", fontStyle: "bold" },
          },
          {
            content: `${m.summary.total_capaian_anggaran_formatted}%`,
            styles: { halign: "center", fontStyle: "bold" },
          },
        ]);
      }

      autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX },
        theme: "grid",
        head: [
          [
            {
              content: "No.",
              rowSpan: 2,
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Program/Kegiatan/Ouput",
              rowSpan: 2,
              colSpan: 2,
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Volume",
              colSpan: 3,
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Anggaran",
              colSpan: 3,
              styles: { halign: "center", valign: "middle" },
            },
          ],
          [
            {
              content: "Target 2026",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Realisasi",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Capaian/\nProgress (%)",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Pagu awal (Rp)",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Realisasi (Rp)",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Capaian (%)",
              styles: { halign: "center", valign: "middle" },
            },
          ],
          [
            { content: "a", styles: { halign: "center", valign: "middle" } },
            {
              content: "b",
              colSpan: 2,
              styles: { halign: "center", valign: "middle" },
            },
            { content: "c", styles: { halign: "center", valign: "middle" } },
            { content: "d", styles: { halign: "center", valign: "middle" } },
            {
              content: "e= (d/c*100)",
              styles: { halign: "center", valign: "middle" },
            },
            { content: "f", styles: { halign: "center", valign: "middle" } },
            { content: "g", styles: { halign: "center", valign: "middle" } },
            {
              content: "h= (g/f*100)",
              styles: { halign: "center", valign: "middle" },
            },
          ],
        ],
        body: bodyRows,
        headStyles: {
          fillColor: [189, 215, 238],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 8.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.25,
          cellPadding: 1.6,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 8.2,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          cellPadding: 1.5,
          valign: "middle",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 20, halign: "left" },
          2: { cellWidth: 97, halign: "left" },
          3: { cellWidth: 21, halign: "center" },
          4: { cellWidth: 21, halign: "center" },
          5: { cellWidth: 24, halign: "center" },
          6: { cellWidth: 27, halign: "center" },
          7: { cellWidth: 27, halign: "center" },
          8: { cellWidth: 22, halign: "center" },
        },
      });

      const autoTableDoc = doc as jsPDF & { lastAutoTable?: { finalY: number } };
      y = (autoTableDoc.lastAutoTable?.finalY || y) + 10;
    });

    // Penutup Berita Acara RO & Tanda Tangan in PDF
    if (y > 150) {
      doc.addPage();
      y = 14;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Demikian berita acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.",
      marginX,
      y
    );
    y += 8;

    const colWidth = contentWidth / 2;
    doc.text(`${pihak2Jabatan},`, marginX + 25, y);
    doc.text(`${pihak1Jabatan},`, marginX + colWidth + 25, y);
    y += 20;

    doc.setFont("helvetica", "bold");
    doc.text(pihak2Nama, marginX + 25, y);
    doc.text(pihak1Nama, marginX + colWidth + 25, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`NIP. ${pihak2Nip}`, marginX + 25, y);
    doc.text(`NIP. ${pihak1Nip}`, marginX + colWidth + 25, y);

    // Section 2: Berita Acara Realisasi RAPK in PDF
    if (rapkMonthsData.length > 0) {
      doc.addPage();
      y = 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text("BERITA ACARA EVALUASI INTERNAL", pageWidth / 2, y, {
        align: "center",
      });
      y += 5;
      doc.text("BALAI BESAR POM DI MATARAM", pageWidth / 2, y, {
        align: "center",
      });
      y += 5;
      doc.text(baHeaderMonthYear.toUpperCase(), pageWidth / 2, y, {
        align: "center",
      });
      y += 8;

      doc.setFontSize(9.5);
      doc.text(openingLines, marginX, y);
      y += openingLines.length * 4.5 + 1.5;

      doc.text("1.", marginX, y);
      doc.text("Nama", labelX, y);
      doc.text(":", colonX, y);
      doc.text(pihak1Nama, valueX, y);
      y += 4.5;
      doc.text("NIP", labelX, y);
      doc.text(":", colonX, y);
      doc.text(pihak1Nip, valueX, y);
      y += 4.5;
      doc.text("Jabatan", labelX, y);
      doc.text(":", colonX, y);
      doc.text(pihak1Jabatan, valueX, y);
      y += 6.5;

      doc.text("2.", marginX, y);
      doc.text("Nama", labelX, y);
      doc.text(":", colonX, y);
      doc.text(pihak2Nama, valueX, y);
      y += 4.5;
      doc.text("NIP", labelX, y);
      doc.text(":", colonX, y);
      doc.text(pihak2Nip, valueX, y);
      y += 4.5;
      doc.text("Jabatan", labelX, y);
      doc.text(":", colonX, y);
      doc.text(pihak2Jabatan, valueX, y);
      y += 7;

      doc.text(evalLines, marginX, y);
      y += evalLines.length * 4.5 + 2;

      doc.text("2.", marginX, y);
      doc.text(rapkSectionTitle, labelX, y);
      y += 6;

      rapkMonthsData.forEach((rm, rmIdx) => {
        if (rmIdx > 0) {
          doc.addPage();
          y = 14;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(rm.month_label, marginX, y);
        doc.setFont("helvetica", "normal");
        y += 3;

        const rapkBodyRows: any[] = rm.rows.map((r) => [
          r.no,
          r.sasaran_strategis,
          r.nama_indikator,
          r.volume.target_2029 || "-",
          r.volume.target_2026 || "-",
          r.volume.target_tw || "-",
          r.volume.realisasi || "-",
          r.volume.capaian_tw || "-",
          r.volume.capaian_2026 || "-",
          r.volume.capaian_2029 || "-",
          r.anggaran.pagu_formatted || "-",
          r.anggaran.realisasi_formatted || "-",
          r.anggaran.capaian_formatted || "-",
        ]);

        if (rm.summary) {
          rapkBodyRows.push([
            {
              content: "JUMLAH",
              colSpan: 3,
              styles: { halign: "center", fontStyle: "bold" },
            },
            { content: "-", styles: { halign: "center" } },
            { content: "-", styles: { halign: "center" } },
            { content: "-", styles: { halign: "center" } },
            { content: "-", styles: { halign: "center" } },
            { content: "-", styles: { halign: "center" } },
            { content: "-", styles: { halign: "center" } },
            { content: "-", styles: { halign: "center" } },
            {
              content: rm.summary.total_pagu_formatted,
              styles: { halign: "center", fontStyle: "bold" },
            },
            {
              content: rm.summary.total_realisasi_formatted,
              styles: { halign: "center", fontStyle: "bold" },
            },
            {
              content: rm.summary.total_capaian_anggaran_formatted,
              styles: { halign: "center", fontStyle: "bold" },
            },
          ]);
        }

        autoTable(doc, {
          startY: y,
          margin: { left: marginX, right: marginX },
          theme: "grid",
          head: [
            [
              { content: "No.", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
              { content: "Sasaran Strategis", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
              { content: "Nama Indikator", rowSpan: 2, styles: { halign: "center", valign: "middle" } },
              { content: "Volume", colSpan: 7, styles: { halign: "center", valign: "middle" } },
              { content: "Anggaran per Sasaran Strategis", colSpan: 3, styles: { halign: "center", valign: "middle" } },
            ],
            [
              { content: "Target 2029", styles: { halign: "center", valign: "middle" } },
              { content: "Target 2026", styles: { halign: "center", valign: "middle" } },
              { content: `Target ${rm.month_label.replace(/.*Bulan\s+/i, "")}`, styles: { halign: "center", valign: "middle" } },
              { content: "Realisasi", styles: { halign: "center", valign: "middle" } },
              { content: "Capaian (%)/\ntarget TW", styles: { halign: "center", valign: "middle" } },
              { content: "Capaian (%)/\ntarget 2026", styles: { halign: "center", valign: "middle" } },
              { content: "Capaian (%)/\ntarget 2029", styles: { halign: "center", valign: "middle" } },
              { content: "Pagu (Rp)", styles: { halign: "center", valign: "middle" } },
              { content: "Realisasi (Rp)", styles: { halign: "center", valign: "middle" } },
              { content: "Capaian (%)", styles: { halign: "center", valign: "middle" } },
            ],
            [
              { content: "a", styles: { halign: "center" } },
              { content: "b", styles: { halign: "center" } },
              { content: "c", styles: { halign: "center" } },
              { content: "d", styles: { halign: "center" } },
              { content: "e", styles: { halign: "center" } },
              { content: "f", styles: { halign: "center" } },
              { content: "g", styles: { halign: "center" } },
              { content: "h=(g/f*100)", styles: { halign: "center" } },
              { content: "i=(g/e*100)", styles: { halign: "center" } },
              { content: "j=(g/d*100)", styles: { halign: "center" } },
              { content: "k", styles: { halign: "center" } },
              { content: "l", styles: { halign: "center" } },
              { content: "m=(l/k*100)", styles: { halign: "center" } },
            ],
          ],
          body: rapkBodyRows,
          headStyles: {
            fillColor: [189, 215, 238],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: 7.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.25,
            cellPadding: 1.2,
          },
          bodyStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 7.2,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            cellPadding: 1.2,
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 8, halign: "center" },
            1: { cellWidth: 38, halign: "left" },
            2: { cellWidth: 50, halign: "left" },
            3: { cellWidth: 14, halign: "center" },
            4: { cellWidth: 14, halign: "center" },
            5: { cellWidth: 14, halign: "center" },
            6: { cellWidth: 14, halign: "center" },
            7: { cellWidth: 15, halign: "center" },
            8: { cellWidth: 15, halign: "center" },
            9: { cellWidth: 15, halign: "center" },
            10: { cellWidth: 26, halign: "center" },
            11: { cellWidth: 26, halign: "center" },
            12: { cellWidth: 16, halign: "center" },
          },
        });

        const rapkAutoDoc = doc as jsPDF & { lastAutoTable?: { finalY: number } };
        y = (rapkAutoDoc.lastAutoTable?.finalY || y) + 10;
      });

      if (y > 150) {
        doc.addPage();
        y = 14;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        "Demikian berita acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.",
        marginX,
        y
      );
      y += 8;

      doc.text(`${pihak2Jabatan},`, marginX + 25, y);
      doc.text(`${pihak1Jabatan},`, marginX + colWidth + 25, y);
      y += 20;

      doc.setFont("helvetica", "bold");
      doc.text(pihak2Nama, marginX + 25, y);
      doc.text(pihak1Nama, marginX + colWidth + 25, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`NIP. ${pihak2Nip}`, marginX + 25, y);
      doc.text(`NIP. ${pihak1Nip}`, marginX + colWidth + 25, y);
    }

    // Section 3: Matriks Rekomendasi in PDF
    if (matriksRekomendasi.length > 0) {
      doc.addPage();
      y = 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.text("3.", marginX, y);
      doc.text(matriksTitle, labelX, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX },
        theme: "grid",
        head: [
          [
            { content: "No.", styles: { halign: "center", valign: "middle" } },
            { content: "Indikator", styles: { halign: "center", valign: "middle" } },
            {
              content: "Kendala / Permasalahan",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Rekomendasi",
              styles: { halign: "center", valign: "middle" },
            },
            {
              content: "Rencana Tindak Lanjut",
              styles: { halign: "center", valign: "middle" },
            },
            { content: "Timeline", styles: { halign: "center", valign: "middle" } },
            {
              content: "Risiko (Y/T)",
              styles: { halign: "center", valign: "middle" },
            },
            { content: "Kode", styles: { halign: "center", valign: "middle" } },
            {
              content: "Peristiwa Resiko",
              styles: { halign: "center", valign: "middle" },
            },
          ],
        ],
        body: matriksRekomendasi.map((item) => {
          const isY = item.is_risiko === "Y" || item.is_risiko === "Ya";
          return [
            item.no,
            item.indikator,
            item.kendala || "-",
            item.rekomendasi || "-",
            item.rencana_tindak_lanjut || "-",
            item.timeline || "-",
            isY ? "Y" : "T",
            isY ? (item.kode_resiko || "-") : "-",
            isY ? (item.peristiwa_resiko || "-") : "-",
          ];
        }),
        headStyles: {
          fillColor: [255, 192, 0], // #ffc000 Gold / Amber sesuai template
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 8.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.25,
          cellPadding: 2,
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontSize: 7.8,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          cellPadding: 1.8,
          valign: "top",
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 38, halign: "left" },
          2: { cellWidth: 50, halign: "left" },
          3: { cellWidth: 50, halign: "left" },
          4: { cellWidth: 50, halign: "left" },
          5: { cellWidth: 18, halign: "center" },
          6: { cellWidth: 16, halign: "center" },
          7: { cellWidth: 16, halign: "center" },
          8: { cellWidth: 26, halign: "left" },
        },
      });
    }

    doc.save(`Berita_Acara_Evaluasi_Internal_${selectedQuarter}_${selectedYear}.pdf`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print-only styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #berita-acara-print-area,
          #berita-acara-print-area * {
            visibility: visible;
          }
          #berita-acara-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: landscape;
            margin: 12mm;
          }
        }
      `}</style>

      {/* Top Toolbar (Hidden when printing) */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs print:hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link href="/siproval/tu" className="hover:text-[#005baa]">
                Dashboard TU
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-800">
                Eksport Laporan Evaluasi Internal
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              Eksport Berita Acara Evaluasi Internal (TU)
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Menyatukan <strong>Bagian 1: Realisasi RAPK Triwulan</strong>{" "}
              (Volume RO & Anggaran) dan{" "}
              <strong>Bagian 2: Matriks Rekomendasi & Kendala Triwulan</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowLampiranConfig((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Icon icon="solar:gallery-bold" width={16} className="text-[#005baa]" />
              <span>{showLampiranConfig ? "Tutup Lampiran Foto" : `Tambah Lampiran Foto (${lampiranFotos.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfig((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Icon icon="solar:pen-new-square-linear" width={16} />
              {showConfig ? "Tutup Pengaturan Teks" : "Edit Teks Berita Acara"}
            </button>

            <Link
              href={`/siproval/tu/matriks-rekomendasi?quarter=${selectedQuarter}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[#005baa]/30 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-[#005baa] transition hover:bg-blue-100"
            >
              <Icon icon="solar:clipboard-list-bold" width={16} />
              Kelola Matriks Rekomendasi
            </Link>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={loading || monthsData.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
            >
              <Icon icon="solar:file-download-bold" width={16} />
              Eksport PDF (.pdf)
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              disabled={loading || monthsData.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004b8d] disabled:opacity-50"
            >
              <Icon icon="solar:file-text-bold" width={16} />
              Eksport Word (.doc)
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={loading || monthsData.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00a651] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#008c44] disabled:opacity-50"
            >
              <Icon icon="solar:file-smile-bold" width={16} />
              Eksport Excel (.xls)
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={loading || monthsData.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-[#005baa]/20 bg-blue-50 px-4 py-2 text-xs font-bold text-[#005baa] transition hover:bg-blue-100 disabled:opacity-50"
            >
              <Icon icon="solar:printer-bold" width={16} />
              Cetak
            </button>
          </div>
        </div>

        {/* Quarter Selector & Source Badges */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs font-bold text-slate-700">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:border-[#005baa] focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    Tahun {y}
                  </option>
                ))}
              </select>
            </div>

            <span className="mr-1 text-xs font-bold text-slate-700">
              Pilih Periode Triwulan:
            </span>
            {availableQuarters.map((q) => {
              const active = selectedQuarter === q.key;
              return (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => handleSelectQuarter(q.key)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    active
                      ? "bg-[#005baa] text-white shadow-xs ring-2 ring-[#005baa]/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {q.short}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 font-medium text-[#005baa]">
              <span className="h-2 w-2 rounded-full bg-[#005baa]" />
              Volume: {sources.volume_tab}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-[#00a651]">
              <span className="h-2 w-2 rounded-full bg-[#00a651]" />
              Anggaran: {sources.anggaran_tab}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              Matriks: {matriksRekomendasi.length} Indikator
            </span>
          </div>
        </div>

        {/* Editable Header Fields */}
        {showConfig && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs md:grid-cols-2">
            <div>
              <label className="block font-semibold text-slate-700">
                Subjudul Bulan/Tahun Berita Acara
              </label>
              <input
                type="text"
                value={baHeaderMonthYear}
                onChange={(e) => setBaHeaderMonthYear(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700">
                Periode Evaluasi Internal
              </label>
              <input
                type="text"
                value={periodeText}
                onChange={(e) => setPeriodeText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700">
                Kalimat Pembuka Berita Acara
              </label>
              <input
                type="text"
                value={baOpeningText}
                onChange={(e) => setBaOpeningText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
              <p className="font-bold text-slate-800">
                Pihak Kesatu (Kepala Balai)
              </p>
              <input
                type="text"
                value={pihak1Nama}
                onChange={(e) => setPihak1Nama(e.target.value)}
                placeholder="Nama"
                className="w-full rounded border border-slate-200 px-2.5 py-1"
              />
              <input
                type="text"
                value={pihak1Nip}
                onChange={(e) => setPihak1Nip(e.target.value)}
                placeholder="NIP"
                className="w-full rounded border border-slate-200 px-2.5 py-1"
              />
              <input
                type="text"
                value={pihak1Jabatan}
                onChange={(e) => setPihak1Jabatan(e.target.value)}
                placeholder="Jabatan"
                className="w-full rounded border border-slate-200 px-2.5 py-1"
              />
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
              <p className="font-bold text-slate-800">
                Pihak Kedua (Ketua Tim Evaluasi Internal)
              </p>
              <input
                type="text"
                value={pihak2Nama}
                onChange={(e) => setPihak2Nama(e.target.value)}
                placeholder="Nama"
                className="w-full rounded border border-slate-200 px-2.5 py-1"
              />
              <input
                type="text"
                value={pihak2Nip}
                onChange={(e) => setPihak2Nip(e.target.value)}
                placeholder="NIP"
                className="w-full rounded border border-slate-200 px-2.5 py-1"
              />
              <input
                type="text"
                value={pihak2Jabatan}
                onChange={(e) => setPihak2Jabatan(e.target.value)}
                placeholder="Jabatan"
                className="w-full rounded border border-slate-200 px-2.5 py-1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700">
                Judul Poin 1 (Tabel Realisasi RO & Anggaran per Output)
              </label>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700">
                Judul Poin 2 (Tabel Realisasi RAPK & Anggaran per Sasaran)
              </label>
              <input
                type="text"
                value={rapkSectionTitle}
                onChange={(e) => setRapkSectionTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700">
                Judul Poin 3 (Matriks Rekomendasi Triwulan)
              </label>
              <input
                type="text"
                value={matriksTitle}
                onChange={(e) => setMatriksTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Lampiran Foto Uploader & Manager */}
        {showLampiranConfig && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 print:hidden">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Unggah Lampiran Dokumentasi Kegiatan (Foto / Gambar)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Foto akan otomatis diselaraskan dengan proporsi 4:3 rapi dan dicetak di halaman lampiran Berita Acara.
              </p>
            </div>

            {/* Dropzone Area Sesuai Format Referensi */}
            <div
              onClick={() => document.getElementById("tu-photo-input")?.click()}
              onDragEnter={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDraggingPhoto(false); }}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingPhoto(false);
                if (e.dataTransfer.files) {
                  handleAddPhotos(e.dataTransfer.files);
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                isDraggingPhoto ? "border-[#005baa] bg-blue-50/50" : "border-slate-200 hover:border-[#005baa]/60 hover:bg-slate-50/50"
              }`}
            >
              <input
                id="tu-photo-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) handleAddPhotos(e.target.files);
                }}
                className="hidden"
              />

              {/* Badges */}
              <div className="flex items-center justify-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#005baa] shadow-2xs">
                  <Icon icon="solar:gallery-bold" width={22} />
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <Icon icon="solar:camera-bold" width={22} />
                </div>
              </div>

              <p className="text-sm font-bold text-slate-800">
                Pilih atau seret file foto ke area ini
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Format didukung: <strong>JPG, JPEG, PNG, WEBP</strong> (Maksimal 10 MB per gambar)
              </p>
            </div>

            {/* List Foto Terunggah */}
            {lampiranFotos.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Daftar Foto Terlampir ({lampiranFotos.length} foto):</span>
                  <button
                    type="button"
                    onClick={() => setLampiranFotos([])}
                    className="text-red-500 hover:underline font-semibold"
                  >
                    Hapus Semua
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {lampiranFotos.map((foto, idx) => (
                    <div
                      key={foto.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2 relative group"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-200">
                        <img
                          src={foto.previewUrl}
                          alt={foto.caption}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">
                          Keterangan Foto {idx + 1}:
                        </label>
                        <input
                          type="text"
                          value={foto.caption}
                          onChange={(e) => handleUpdateCaption(foto.id, e.target.value)}
                          placeholder="Masukkan judul / keterangan foto"
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-[#005baa] focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(foto.id)}
                        className="absolute top-4 right-4 rounded-full bg-red-600 p-1 text-white opacity-80 hover:opacity-100 shadow-md transition"
                        title="Hapus foto ini"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Strip (Hidden when printing) */}
      {summary && !loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 print:hidden">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase text-slate-400">
              Total Output (RO)
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {summary.total_output} Output
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase text-slate-400">
              Pagu Anggaran ({selectedQuarter})
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              Rp {summary.total_pagu_formatted}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase text-slate-400">
              Realisasi Kumulatif Akhir
            </p>
            <p className="mt-1 text-xl font-bold text-[#005baa]">
              Rp {summary.total_realisasi_formatted}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase text-slate-400">
              Matriks Rekomendasi
            </p>
            <p className="mt-1 text-xl font-bold text-amber-600">
              {matriksRekomendasi.length} Indikator
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#005baa] border-r-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Menggabungkan data Triwulan ({quarterLabel})...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Memuat Tabel Capaian Anggaran & Matriks Rekomendasi
          </p>
        </div>
      ) : (
        /* Official Berita Acara Document Sheet */
        <div
          id="berita-acara-print-area"
          ref={printAreaRef}
          className="mx-auto rounded-2xl border border-slate-300 bg-white p-6 text-black shadow-sm sm:p-10 lg:p-12"
          style={{ fontFamily: "Calibri, Arial, sans-serif" }}
        >
          {/* Document Title */}
          <div className="mb-6 text-center leading-snug text-black">
            <p className="text-sm sm:text-[15px] font-normal uppercase">
              BERITA ACARA EVALUASI INTERNAL
            </p>
            <p className="text-sm sm:text-[15px] font-normal uppercase">
              BALAI BESAR POM DI MATARAM
            </p>
            <p className="text-sm sm:text-[15px] font-normal uppercase">
              {baHeaderMonthYear}
            </p>
          </div>

          {/* Opening Paragraph */}
          <p className="mb-3 text-xs sm:text-[13.5px] leading-relaxed text-black">
            {baOpeningText}
          </p>

          {/* Signatories 1 & 2 */}
          <div className="mb-4 space-y-3 text-xs sm:text-[13.5px] leading-snug text-black">
            <div className="grid grid-cols-[28px_90px_14px_1fr]">
              <span>1.</span>
              <span>Nama</span>
              <span>:</span>
              <span>{pihak1Nama}</span>

              <span />
              <span>NIP</span>
              <span>:</span>
              <span>{pihak1Nip}</span>

              <span />
              <span>Jabatan</span>
              <span>:</span>
              <span>{pihak1Jabatan}</span>
            </div>

            <div className="grid grid-cols-[28px_90px_14px_1fr]">
              <span>2.</span>
              <span>Nama</span>
              <span>:</span>
              <span>{pihak2Nama}</span>

              <span />
              <span>NIP</span>
              <span>:</span>
              <span>{pihak2Nip}</span>

              <span />
              <span>Jabatan</span>
              <span>:</span>
              <span>{pihak2Jabatan}</span>
            </div>
          </div>

          {/* Evaluation Statement */}
          <p className="mb-4 text-xs sm:text-[13.5px] leading-relaxed text-black">
            Telah melaksanakan evaluasi internal terhadap realisasi anggaran dan
            capaian kinerja pada Balai Besar POM di Mataram periode {periodeText}{" "}
            dengan hasil sebagai berikut :
          </p>

          {/* SECTION 1: Capaian Anggaran & Kinerja 3 Bulan */}
          <div className="mb-3 text-xs sm:text-[13.5px] leading-snug text-black">
            <div className="grid grid-cols-[28px_1fr]">
              <span>1.</span>
              <div>
                <p className="font-normal">{sectionTitle}</p>
              </div>
            </div>
          </div>

          {/* Render each of the 3 months in Section 1 */}
          <div className="space-y-8">
            {monthsData.map((m) => (
              <div key={m.month_key} className="space-y-2">
                <div className="font-bold text-xs sm:text-[13px] text-black">
                  {m.month_label}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[12px] text-black">
                    <thead>
                      <tr className="bg-[#bdd7ee] font-bold text-black">
                        <th
                          rowSpan={2}
                          className="w-10 border border-black px-2 py-2 text-center align-middle"
                        >
                          No.
                        </th>
                        <th
                          rowSpan={2}
                          colSpan={2}
                          className="border border-black px-3 py-2 text-center align-middle"
                        >
                          Program/Kegiatan/Ouput
                        </th>
                        <th
                          colSpan={3}
                          className="border border-black px-2 py-1.5 text-center align-middle"
                        >
                          Volume
                        </th>
                        <th
                          colSpan={3}
                          className="border border-black px-2 py-1.5 text-center align-middle"
                        >
                          Anggaran
                        </th>
                      </tr>
                      <tr className="bg-[#bdd7ee] font-bold text-black">
                        <th className="w-24 border border-black px-2 py-1.5 text-center align-middle">
                          Target 2026
                        </th>
                        <th className="w-24 border border-black px-2 py-1.5 text-center align-middle">
                          Realisasi
                        </th>
                        <th className="w-28 border border-black px-2 py-1.5 text-center align-middle leading-tight">
                          Capaian/
                          <br />
                          Progress (%)
                        </th>
                        <th className="w-32 border border-black px-2 py-1.5 text-center align-middle">
                          Pagu awal (Rp)
                        </th>
                        <th className="w-32 border border-black px-2 py-1.5 text-center align-middle">
                          Realisasi (Rp)
                        </th>
                        <th className="w-28 border border-black px-2 py-1.5 text-center align-middle">
                          Capaian (%)
                        </th>
                      </tr>
                      <tr className="bg-[#bdd7ee] text-[11px] font-bold text-black">
                        <th className="border border-black px-1.5 py-1 text-center">
                          a
                        </th>
                        <th
                          colSpan={2}
                          className="border border-black px-2 py-1 text-center"
                        >
                          b
                        </th>
                        <th className="border border-black px-1.5 py-1 text-center">
                          c
                        </th>
                        <th className="border border-black px-1.5 py-1 text-center">
                          d
                        </th>
                        <th className="border border-black px-1.5 py-1 text-center">
                          e= (d/c*100)
                        </th>
                        <th className="border border-black px-1.5 py-1 text-center">
                          f
                        </th>
                        <th className="border border-black px-1.5 py-1 text-center">
                          g
                        </th>
                        <th className="border border-black px-1.5 py-1 text-center">
                          h= (g/f*100)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.rows.map((row) => (
                        <tr key={row.kode_ro} className="hover:bg-slate-50/80">
                          <td className="border border-black px-2 py-1.5 text-center align-middle">
                            {row.no}
                          </td>
                          <td className="w-24 whitespace-nowrap border border-black px-2 py-1.5 text-left align-middle font-medium">
                            {row.kode_ro}
                          </td>
                          <td className="border border-black px-2.5 py-1.5 text-left align-middle leading-snug">
                            {row.nama_ro}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-center align-middle">
                            {row.volume.target_formatted}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-center align-middle">
                            {row.volume.realisasi_formatted}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-center align-middle">
                            {row.volume.capaian_formatted}
                          </td>
                          <td className="border border-black px-2.5 py-1.5 text-center align-middle">
                            {row.anggaran.pagu_formatted}
                          </td>
                          <td className="border border-black px-2.5 py-1.5 text-center align-middle">
                            {row.anggaran.realisasi_formatted}
                          </td>
                          <td className="border border-black px-2 py-1.5 text-center align-middle">
                            {row.anggaran.capaian_formatted}
                          </td>
                        </tr>
                      ))}

                      {/* Summary Row */}
                      {m.summary && (
                        <tr className="bg-[#bdd7ee]/40 font-bold text-black border-t-2 border-black">
                          <td
                            colSpan={3}
                            className="border border-black px-3 py-2 text-center align-middle font-bold uppercase tracking-wider"
                          >
                            JUMLAH
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-middle">
                            -
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-middle">
                            -
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-middle">
                            -
                          </td>
                          <td className="border border-black px-2.5 py-2 text-center align-middle font-bold">
                            {m.summary.total_pagu_formatted}
                          </td>
                          <td className="border border-black px-2.5 py-2 text-center align-middle font-bold">
                            {m.summary.total_realisasi_formatted}
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-middle font-bold">
                            {m.summary.total_capaian_anggaran_formatted}%
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Penutup Berita Acara Realisasi RO */}
          <div className="mt-8 text-xs sm:text-[13px] leading-relaxed text-black">
            <p className="mb-4">
              Demikian berita acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4 text-center">
              <div>
                <p className="font-normal">{pihak2Jabatan},</p>
                <div className="h-16" />
                <p className="font-bold underline">{pihak2Nama}</p>
                <p className="text-[11px]">NIP. {pihak2Nip}</p>
              </div>
              <div>
                <p className="font-normal">{pihak1Jabatan},</p>
                <div className="h-16" />
                <p className="font-bold underline">{pihak1Nama}</p>
                <p className="text-[11px]">NIP. {pihak1Nip}</p>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: BERITA ACARA EVALUASI INTERNAL - REALISASI RAPK */}
          <div className="mt-16 pt-8 border-t-2 border-dashed border-slate-300 print:border-none print:pt-0 print:break-before-page">
            {/* Document Title Berita Acara RAPK */}
            <div className="mb-6 text-center leading-snug text-black">
              <p className="text-sm sm:text-[15px] font-normal uppercase">
                BERITA ACARA EVALUASI INTERNAL
              </p>
              <p className="text-sm sm:text-[15px] font-normal uppercase">
                BALAI BESAR POM DI MATARAM
              </p>
              <p className="text-sm sm:text-[15px] font-normal uppercase">
                {baHeaderMonthYear}
              </p>
            </div>

            {/* Opening Paragraph */}
            <p className="mb-3 text-xs sm:text-[13.5px] leading-relaxed text-black">
              {baOpeningText}
            </p>

            {/* Signatories 1 & 2 */}
            <div className="mb-4 space-y-3 text-xs sm:text-[13.5px] leading-snug text-black">
              <div className="grid grid-cols-[28px_90px_14px_1fr]">
                <span>1.</span>
                <span>Nama</span>
                <span>:</span>
                <span>{pihak1Nama}</span>

                <span />
                <span>NIP</span>
                <span>:</span>
                <span>{pihak1Nip}</span>

                <span />
                <span>Jabatan</span>
                <span>:</span>
                <span>{pihak1Jabatan}</span>
              </div>

              <div className="grid grid-cols-[28px_90px_14px_1fr]">
                <span>2.</span>
                <span>Nama</span>
                <span>:</span>
                <span>{pihak2Nama}</span>

                <span />
                <span>NIP</span>
                <span>:</span>
                <span>{pihak2Nip}</span>

                <span />
                <span>Jabatan</span>
                <span>:</span>
                <span>{pihak2Jabatan}</span>
              </div>
            </div>

            {/* Evaluation Statement */}
            <p className="mb-4 text-xs sm:text-[13.5px] leading-relaxed text-black">
              Telah melaksanakan evaluasi internal terhadap realisasi anggaran dan
              capaian kinerja pada Balai Besar POM di Mataram periode {periodeText}{" "}
              dengan hasil sebagai berikut :
            </p>

            {/* SECTION 2: Capaian Rencana Aksi Perjanjian Kinerja (RAPK) */}
            <div className="mb-3 text-xs sm:text-[13.5px] leading-snug text-black">
              <div className="grid grid-cols-[28px_1fr]">
                <span>2.</span>
                <div>
                  <p className="font-normal">{rapkSectionTitle}</p>
                </div>
              </div>
            </div>

            {/* Render 3 Months of RAPK Tables */}
            <div className="space-y-8">
              {rapkMonthsData.map((rm) => (
                <div key={rm.month_key} className="space-y-2">
                  <div className="font-bold text-xs sm:text-[13px] text-black">
                    {rm.month_label}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-[11.5px] text-black">
                      <thead>
                        <tr className="bg-[#bdd7ee] font-bold text-black">
                          <th
                            rowSpan={2}
                            className="w-10 border border-black px-2 py-2 text-center align-middle"
                          >
                            No.
                          </th>
                          <th
                            rowSpan={2}
                            className="w-48 border border-black px-3 py-2 text-center align-middle"
                          >
                            Sasaran Strategis
                          </th>
                          <th
                            rowSpan={2}
                            className="min-w-[180px] border border-black px-3 py-2 text-center align-middle"
                          >
                            Nama Indikator
                          </th>
                          <th
                            colSpan={7}
                            className="border border-black px-2 py-1.5 text-center align-middle"
                          >
                            Volume
                          </th>
                          <th
                            colSpan={3}
                            className="border border-black px-2 py-1.5 text-center align-middle"
                          >
                            Anggaran per Sasaran Strategis
                          </th>
                        </tr>
                        <tr className="bg-[#bdd7ee] font-bold text-black text-[11px]">
                          <th className="w-16 border border-black px-1.5 py-1 text-center align-middle">
                            Target 2029
                          </th>
                          <th className="w-16 border border-black px-1.5 py-1 text-center align-middle">
                            Target 2026
                          </th>
                          <th className="w-16 border border-black px-1.5 py-1 text-center align-middle">
                            Target {rm.month_label.replace(/.*Bulan\s+/i, "")}
                          </th>
                          <th className="w-16 border border-black px-1.5 py-1 text-center align-middle">
                            Realisasi
                          </th>
                          <th className="w-20 border border-black px-1.5 py-1 text-center align-middle leading-tight">
                            Capaian (%) /<br />target TW
                          </th>
                          <th className="w-20 border border-black px-1.5 py-1 text-center align-middle leading-tight">
                            Capaian (%) /<br />target 2026
                          </th>
                          <th className="w-20 border border-black px-1.5 py-1 text-center align-middle leading-tight">
                            Capaian (%) /<br />target 2029
                          </th>
                          <th className="w-24 border border-black px-2 py-1 text-center align-middle">
                            Pagu (Rp)
                          </th>
                          <th className="w-24 border border-black px-2 py-1 text-center align-middle">
                            Realisasi (Rp)
                          </th>
                          <th className="w-20 border border-black px-1.5 py-1 text-center align-middle">
                            Capaian (%)
                          </th>
                        </tr>
                        <tr className="bg-[#bdd7ee] text-[10.5px] font-bold text-black">
                          <th className="border border-black px-1 py-0.5 text-center">a</th>
                          <th className="border border-black px-1 py-0.5 text-center">b</th>
                          <th className="border border-black px-1 py-0.5 text-center">c</th>
                          <th className="border border-black px-1 py-0.5 text-center">d</th>
                          <th className="border border-black px-1 py-0.5 text-center">e</th>
                          <th className="border border-black px-1 py-0.5 text-center">f</th>
                          <th className="border border-black px-1 py-0.5 text-center">g</th>
                          <th className="border border-black px-1 py-0.5 text-center leading-none">
                            h=(g/f*100)
                          </th>
                          <th className="border border-black px-1 py-0.5 text-center leading-none">
                            i=(g/e*100)
                          </th>
                          <th className="border border-black px-1 py-0.5 text-center leading-none">
                            j=(g/d*100)
                          </th>
                          <th className="border border-black px-1 py-0.5 text-center">k</th>
                          <th className="border border-black px-1 py-0.5 text-center">l</th>
                          <th className="border border-black px-1 py-0.5 text-center leading-none">
                            m=(l/k*100)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rm.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/80">
                            <td className="border border-black px-2 py-1 text-center align-middle">
                              {row.no}
                            </td>
                            <td className="border border-black px-2 py-1 text-left align-middle leading-snug">
                              {row.sasaran_strategis}
                            </td>
                            <td className="border border-black px-2.5 py-1 text-left align-middle leading-snug">
                              {row.nama_indikator}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-center align-middle">
                              {row.volume.target_2029 || "-"}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-center align-middle">
                              {row.volume.target_2026 || "-"}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-center align-middle">
                              {row.volume.target_tw || "-"}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-center align-middle">
                              {row.volume.realisasi || "-"}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-center align-middle">
                              {row.volume.capaian_tw || "-"}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-center align-middle">
                              {row.volume.capaian_2026 || "-"}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-center align-middle">
                              {row.volume.capaian_2029 || "-"}
                            </td>
                            <td className="border border-black px-2 py-1 text-center align-middle font-medium">
                              {row.anggaran.pagu_formatted || "-"}
                            </td>
                            <td className="border border-black px-2 py-1 text-center align-middle font-medium">
                              {row.anggaran.realisasi_formatted || "-"}
                            </td>
                            <td className="border border-black px-1.5 py-1 text-center align-middle">
                              {row.anggaran.capaian_formatted || "-"}
                            </td>
                          </tr>
                        ))}

                        {/* Baris Total / Summary RAPK */}
                        {rm.summary && (
                          <tr className="bg-[#bdd7ee]/40 font-bold text-black border-t-2 border-black">
                            <td
                              colSpan={3}
                              className="border border-black px-3 py-2 text-center align-middle font-bold uppercase tracking-wider"
                            >
                              JUMLAH
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center align-middle">
                              -
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center align-middle">
                              -
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center align-middle">
                              -
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center align-middle">
                              -
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center align-middle">
                              -
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center align-middle">
                              -
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center align-middle">
                              -
                            </td>
                            <td className="border border-black px-2 py-2 text-center align-middle font-bold">
                              {rm.summary.total_pagu_formatted}
                            </td>
                            <td className="border border-black px-2 py-2 text-center align-middle font-bold">
                              {rm.summary.total_realisasi_formatted}
                            </td>
                            <td className="border border-black px-1.5 py-2 text-center align-middle font-bold">
                              {rm.summary.total_capaian_anggaran_formatted}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Penutup Berita Acara RAPK */}
            <div className="mt-8 text-xs sm:text-[13px] leading-relaxed text-black">
              <p className="mb-4">
                Demikian berita acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4 text-center">
                <div>
                  <p className="font-normal">{pihak2Jabatan},</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{pihak2Nama}</p>
                  <p className="text-[11px]">NIP. {pihak2Nip}</p>
                </div>
                <div>
                  <p className="font-normal">{pihak1Jabatan},</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{pihak1Nama}</p>
                  <p className="text-[11px]">NIP. {pihak1Nip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Matriks Rekomendasi Triwulan */}
          <div className="mt-16 pt-8 border-t-2 border-dashed border-slate-300 print:border-none print:pt-0 print:break-before-page space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-[13.5px] leading-snug text-black">
              <div className="grid grid-cols-[28px_1fr]">
                <span>3.</span>
                <div>
                  <p className="font-normal">{matriksTitle}</p>
                </div>
              </div>
              <Link
                href={`/siproval/tu/matriks-rekomendasi?quarter=${selectedQuarter}`}
                className="print:hidden inline-flex items-center gap-1.5 rounded-lg border border-[#005baa]/20 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#005baa] hover:bg-blue-100"
              >
                <Icon icon="solar:pen-new-square-bold" width={14} />
                Edit Formulir Matriks Rekomendasi
              </Link>
            </div>

            {matriksRekomendasi.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                Belum ada data Matriks Rekomendasi untuk {selectedQuarter}. Silakan isi melalui menu{" "}
                <Link
                  href={`/siproval/tu/matriks-rekomendasi?quarter=${selectedQuarter}`}
                  className="font-semibold text-[#005baa] underline"
                >
                  Matriks Rekomendasi
                </Link>
                .
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-[11.5px] text-black">
                  <thead>
                    <tr className="bg-[#ffc000] font-bold text-black text-center">
                      <th className="w-10 border border-black px-2 py-2 text-center align-middle">
                        No.
                      </th>
                      <th className="min-w-[180px] border border-black px-3 py-2 text-center align-middle">
                        Indikator
                      </th>
                      <th className="min-w-[220px] border border-black px-3 py-2 text-center align-middle">
                        Kendala / Permasalahan
                      </th>
                      <th className="min-w-[220px] border border-black px-3 py-2 text-center align-middle">
                        Rekomendasi
                      </th>
                      <th className="min-w-[220px] border border-black px-3 py-2 text-center align-middle">
                        Rencana Tindak Lanjut
                      </th>
                      <th className="w-24 border border-black px-2 py-2 text-center align-middle">
                        Timeline
                      </th>
                      <th className="w-24 border border-black px-2 py-2 text-center align-middle">
                        Apakah Sudah dikelola sebagai risiko (Y/T)
                      </th>
                      <th className="w-20 border border-black px-2 py-2 text-center align-middle">
                        Kode Resiko
                      </th>
                      <th className="min-w-[180px] border border-black px-3 py-2 text-center align-middle">
                        Peristiwa Resiko
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matriksRekomendasi.map((item) => {
                      const isY = item.is_risiko === "Y" || item.is_risiko === "Ya";
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="border border-black px-2 py-2 text-center align-top font-semibold">
                            {item.no}
                          </td>
                          <td className="border border-black px-3 py-2 text-left font-bold align-top leading-snug">
                            {item.indikator}
                          </td>
                          <td className="border border-black px-3 py-2 text-left whitespace-pre-line align-top leading-relaxed">
                            {item.kendala || "-"}
                          </td>
                          <td className="border border-black px-3 py-2 text-left whitespace-pre-line align-top leading-relaxed">
                            {item.rekomendasi || "-"}
                          </td>
                          <td className="border border-black px-3 py-2 text-left whitespace-pre-line align-top leading-relaxed">
                            {item.rencana_tindak_lanjut || "-"}
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-top whitespace-nowrap">
                            {item.timeline || "-"}
                          </td>
                          <td className="border border-black px-2 py-2 text-center align-top font-bold">
                            {isY ? "Y" : "T"}
                          </td>
                          <td className="border border-black px-2 py-2 text-center font-mono align-top">
                            {isY ? (item.kode_resiko || "-") : "-"}
                          </td>
                          <td className="border border-black px-3 py-2 text-left whitespace-pre-line align-top leading-relaxed">
                            {isY ? (item.peristiwa_resiko || "-") : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Penutup & Tanda Tangan Matriks Rekomendasi */}
            <div className="mt-8 text-xs sm:text-[13px] leading-relaxed text-black">
              <div className="grid grid-cols-2 gap-8 pt-4 text-center">
                <div>
                  <p className="font-normal">{pihak2Jabatan},</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{pihak2Nama}</p>
                  <p className="text-[11px]">NIP. {pihak2Nip}</p>
                </div>
                <div>
                  <p className="font-normal">{pihak1Jabatan},</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{pihak1Nama}</p>
                  <p className="text-[11px]">NIP. {pihak1Nip}</p>
                </div>
              </div>
            </div>

            {/* Bagian 3: Lampiran Foto Dokumentasi Kegiatan (Jika ada) */}
            {lampiranFotos.length > 0 && (
              <div className="mt-12 pt-8 border-t-2 border-slate-300 print:break-before-page">
                <div className="mb-6 text-center">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-black">
                    LAMPIRAN DOKUMENTASI KEGIATAN EVALUASI INTERNAL
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Triwulan {selectedQuarter} Tahun Anggaran {selectedYear} &bull; Balai Besar Pengawas Obat dan Makanan di Mataram
                  </p>
                </div>

                {/* Eye-Comforting Aligned Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                  {lampiranFotos.map((foto, fIdx) => (
                    <div
                      key={foto.id}
                      className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs break-inside-avoid"
                    >
                      <div className="w-full aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <img
                          src={foto.previewUrl}
                          alt={foto.caption}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="mt-3 text-center text-xs font-semibold text-slate-800 italic leading-snug">
                        Foto {fIdx + 1}: {foto.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
