"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

type MonthOption = {
  key: string;
  label: string;
  short: string;
  budget_tab_id: number;
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

type ReportSources = {
  volume_spreadsheet: string;
  volume_tab: string;
  anggaran_spreadsheet: string;
  anggaran_tab: string;
};

export default function LaporanEvaluasiTu() {
  const { user } = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const initialMonth = (searchParams.get("month") || "APRIL").toUpperCase();

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [monthLabel, setMonthLabel] = useState<string>("Bulan April 2026");
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([
    { key: "JANUARI", label: "Bulan Januari 2026", short: "Januari", budget_tab_id: 171 },
    { key: "FEBRUARI", label: "Sampai Bulan Februari 2026", short: "Februari", budget_tab_id: 172 },
    { key: "MARET", label: "Sampai Bulan Maret 2026", short: "Maret", budget_tab_id: 173 },
    { key: "APRIL", label: "Bulan April 2026", short: "April", budget_tab_id: 175 },
    { key: "MEI", label: "Sampai Bulan Mei 2026", short: "Mei", budget_tab_id: 176 },
    { key: "JUNI", label: "Sampai Bulan Juni 2026", short: "Juni", budget_tab_id: 177 },
    { key: "JULI", label: "Sampai Bulan Juli 2026", short: "Juli", budget_tab_id: 178 },
  ]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [sources, setSources] = useState<ReportSources>({
    volume_spreadsheet: "Realisasi RO 2026",
    volume_tab: "Realisasi RO (Tab 155)",
    anggaran_spreadsheet: "Maping Anggaran 2026",
    anggaran_tab: "April 2026 (Tab 175)",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Editable Berita Acara Metadata matching the template screenshot
  const [baHeaderMonthYear, setBaHeaderMonthYear] = useState("MARET TAHUN 2026");
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

  const printAreaRef = useRef<HTMLDivElement>(null);

  const fetchReport = async (month: string) => {
    setLoading(true);
    setError("");
    try {
      const query = user?.id
        ? `?month=${encodeURIComponent(month)}&user_id=${encodeURIComponent(String(user.id))}`
        : `?month=${encodeURIComponent(month)}`;
      const res = await api.get(`${baseUrl}/api/tu/laporan-evaluasi/2026${query}`);

      if (res.data?.data) {
        const d = res.data.data;
        setRows(d.rows || []);
        setMonthLabel(d.month_label || `Bulan ${month} 2026`);
        if (Array.isArray(d.available_months) && d.available_months.length > 0) {
          setAvailableMonths(d.available_months);
        }
        if (d.summary) {
          setSummary(d.summary);
        }
        if (d.sources) {
          setSources(d.sources);
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
      fetchReport(selectedMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, user?.id]);

  // Build HTML string for Word / Excel export
  const buildDocumentHtml = (forExcel = false) => {
    const rowsHtml = rows
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
      .join("");

    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>Berita Acara Evaluasi Internal - ${monthLabel}</title>
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
          }
          .header-cell {
            background-color: #bdd7ee;
            border: 1px solid #000000;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            padding: 5px 6px;
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

        <div style="margin-bottom:6px;">
          <div>1.&nbsp;&nbsp;&nbsp;&nbsp;${sectionTitle}</div>
          <div style="margin-left:28px; font-weight:bold;">${monthLabel}</div>
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
            ${rowsHtml}
          </tbody>
        </table>
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
    a.download = `Berita_Acara_Evaluasi_Internal_${selectedMonth}_2026.doc`;
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
    a.download = `Laporan_Evaluasi_Internal_TU_${selectedMonth}_2026.xls`;
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
    y += 4.5;
    doc.setFont("helvetica", "bold");
    doc.text(monthLabel, labelX, y);
    doc.setFont("helvetica", "normal");
    y += 3;

    // Table with 3-row header matching the official template
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
          { content: "Target 2026", styles: { halign: "center", valign: "middle" } },
          { content: "Realisasi", styles: { halign: "center", valign: "middle" } },
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
          { content: "Capaian (%)", styles: { halign: "center", valign: "middle" } },
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
      body: rows.map((r) => [
        r.no,
        r.kode_ro,
        r.nama_ro,
        r.volume.target_formatted,
        r.volume.realisasi_formatted,
        r.volume.capaian_formatted,
        r.anggaran.pagu_formatted,
        r.anggaran.realisasi_formatted,
        r.anggaran.capaian_formatted,
      ]),
      headStyles: {
        fillColor: [189, 215, 238], // #bdd7ee
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

    doc.save(`Berita_Acara_Evaluasi_Internal_${selectedMonth}_2026.pdf`);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print-only styling so printing / saving as PDF outputs the exact official Berita Acara */}
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
              Kolom <strong>Volume</strong> diambil otomatis dari{" "}
              <Link
                href="/siproval/tu/realisasi-ro"
                className="font-semibold text-[#005baa] underline"
              >
                Realisasi RO
              </Link>{" "}
              dan kolom <strong>Anggaran</strong> diambil otomatis dari{" "}
              <Link
                href="/siproval/budget-mapping/year?year=2026"
                className="font-semibold text-[#005baa] underline"
              >
                Budget Mapping
              </Link>
              .
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowConfig((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Icon icon="solar:pen-new-square-linear" width={16} />
              {showConfig ? "Tutup Pengaturan Teks" : "Edit Teks Berita Acara"}
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
            >
              <Icon icon="solar:file-download-bold" width={16} />
              Eksport PDF (.pdf)
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#005baa] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#004b8d] disabled:opacity-50"
            >
              <Icon icon="solar:file-text-bold" width={16} />
              Eksport Word (.doc)
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00a651] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#008c44] disabled:opacity-50"
            >
              <Icon icon="solar:file-smile-bold" width={16} />
              Eksport Excel (.xls)
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-[#005baa]/20 bg-blue-50 px-4 py-2 text-xs font-bold text-[#005baa] transition hover:bg-blue-100 disabled:opacity-50"
            >
              <Icon icon="solar:printer-bold" width={16} />
              Cetak
            </button>
          </div>
        </div>

        {/* Month Selector & Source Badges */}
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-slate-600">
              Pilih Periode Bulan:
            </span>
            {availableMonths.map((m) => {
              const active = selectedMonth === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedMonth(m.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-[#005baa] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m.short}
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
          </div>
        </div>

        {/* Optional Editable Header Fields */}
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
              <p className="font-bold text-slate-800">Pihak Kesatu (Kepala Balai)</p>
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
                Judul Poin 1 Tabel
              </label>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800"
              />
            </div>
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
              Total Pagu Awal (Rp)
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              Rp {summary.total_pagu_formatted}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase text-slate-400">
              Total Realisasi Anggaran (Rp)
            </p>
            <p className="mt-1 text-xl font-bold text-[#005baa]">
              Rp {summary.total_realisasi_formatted}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <p className="text-[11px] font-semibold uppercase text-slate-400">
              Rata-Rata Serapan Anggaran
            </p>
            <p className="mt-1 text-xl font-bold text-[#00a651]">
              {summary.total_capaian_anggaran_formatted}%
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
          <p className="mt-3 text-sm text-slate-500">
            Menggabungkan data Volume (Realisasi RO) dan Anggaran (Budget Mapping)...
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

          {/* Section 1 Heading */}
          <div className="mb-2 text-xs sm:text-[13.5px] leading-snug text-black">
            <div className="grid grid-cols-[28px_1fr]">
              <span>1.</span>
              <div>
                <p>{sectionTitle}</p>
                <p className="mt-0.5 font-bold">{monthLabel}</p>
              </div>
            </div>
          </div>

          {/* Main Report Table matching the uploaded template */}
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
                  <th className="border border-black px-1.5 py-1 text-center">a</th>
                  <th
                    colSpan={2}
                    className="border border-black px-2 py-1 text-center"
                  >
                    b
                  </th>
                  <th className="border border-black px-1.5 py-1 text-center">c</th>
                  <th className="border border-black px-1.5 py-1 text-center">d</th>
                  <th className="border border-black px-1.5 py-1 text-center">
                    e= (d/c*100)
                  </th>
                  <th className="border border-black px-1.5 py-1 text-center">f</th>
                  <th className="border border-black px-1.5 py-1 text-center">g</th>
                  <th className="border border-black px-1.5 py-1 text-center">
                    h= (g/f*100)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.kode_ro} className="hover:bg-slate-50/80">
                    <td className="border border-black px-2 py-1.5 text-center align-middle">
                      {row.no}
                    </td>
                    <td className="w-24 whitespace-nowrap border border-black px-2 py-1.5 text-left align-middle">
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
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

