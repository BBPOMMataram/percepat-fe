import ExcelJS from "exceljs";
import {
    CHECKLIST_SECTIONS,
    getSignatureUrl,
    type PengendalianMutuRecord,
} from "./data";

const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF64748B" } },
    left: { style: "thin", color: { argb: "FF64748B" } },
    bottom: { style: "thin", color: { argb: "FF64748B" } },
    right: { style: "thin", color: { argb: "FF64748B" } },
};

async function loadSignature(signaturePath: string): Promise<{ base64: string; extension: "png" | "jpeg" }> {
    const signatureUrl = getSignatureUrl(signaturePath);
    if (!signatureUrl) {
        throw new Error("Tanda tangan penguji belum tersedia pada data checklist ini.");
    }
    const response = await fetch(signatureUrl);
    if (!response.ok) {
        throw new Error("Tanda tangan penguji tidak dapat diunduh. Periksa koneksi atau perbarui tanda tangan pada profil.");
    }

    const mimeType = response.headers.get("content-type")?.split(";")[0].toLowerCase();
    const extension = mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpeg" : mimeType === "image/png" ? "png" : null;
    if (!extension) {
        throw new Error("Format tanda tangan penguji harus berupa gambar PNG atau JPEG agar dapat disertakan dalam Excel.");
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });

    return {
        base64: `data:${mimeType};base64,${window.btoa(binary)}`,
        extension,
    };
}

function styleCell(cell: ExcelJS.Cell, options: { bold?: boolean; fill?: string; align?: ExcelJS.Alignment["horizontal"] } = {}) {
    cell.font = { name: "Arial", size: 9, bold: options.bold ?? false };
    cell.alignment = { vertical: "middle", horizontal: options.align ?? "left", wrapText: true };
    cell.border = thinBorder;
    if (options.fill) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: options.fill } };
    }
}

function setMergedValue(
    worksheet: ExcelJS.Worksheet,
    row: number,
    startColumn: number,
    endColumn: number,
    value: string,
    bold = false,
) {
    worksheet.mergeCells(row, startColumn, row, endColumn);
    const cell = worksheet.getCell(row, startColumn);
    cell.value = value;
    styleCell(cell, { bold });
    for (let column = startColumn; column <= endColumn; column += 1) {
        worksheet.getCell(row, column).border = thinBorder;
    }
}

export async function exportPengendalianMutuToExcel(record: PengendalianMutuRecord): Promise<void> {
    if (!record.pengujiSignaturePath) {
        throw new Error("Tanda tangan penguji belum tersedia pada data checklist ini.");
    }

    const signature = await loadSignature(record.pengujiSignaturePath);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = record.pengujiNama || "BBPOM di Mataram";
    workbook.created = new Date();
    workbook.subject = "Checklist pengendalian mutu pengujian mikrobiologi";
    const worksheet = workbook.addWorksheet("Checklist Pengendalian Mutu", {
        pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    worksheet.columns = [
        { width: 7 },
        { width: 28 },
        { width: 4 },
        { width: 66 },
        { width: 8 },
        { width: 8 },
        { width: 8 },
        { width: 34 },
        { width: 20 },
    ];
    worksheet.pageSetup.margins = { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };
    worksheet.properties.defaultRowHeight = 24;

    setMergedValue(worksheet, 1, 1, 9, "LEMBAR CHECKLIST PENGENDALIAN MUTU PENGUJIAN MIKROBIOLOGI PANGAN", true);
    worksheet.getRow(1).height = 25;
    worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getCell("A1").font = { name: "Arial", size: 12, bold: true };
    setMergedValue(worksheet, 2, 1, 9, "BALAI BESAR PENGAWAS OBAT DAN MAKANAN DI MATARAM", true);
    worksheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 22;

    setMergedValue(worksheet, 4, 1, 9, "INFORMASI PENGUJIAN", true);
    worksheet.getCell("A4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    worksheet.getRow(4).height = 21;

    const infoRows: [number, string, string][] = [
        [5, "Tanggal Pengujian", new Date(`${record.tanggalPengujian}T00:00:00`).toLocaleDateString("id-ID")],
        [6, "Jenis Sampel", record.jenisSampel.join(", ")],
        [7, "Parameter Pengujian", record.parameterPengujian],
        [8, "Metode Pengujian", record.metodePengujian === "molekuler" ? "Molekuler (RTi-PCR)" : "Kultur / Konvensional"],
        [9, "Status Akhir", record.statusAkhir === "valid" ? "VALID" : "INVALID / RE-TEST"],
    ];

    for (const [row, label, value] of infoRows) {
        setMergedValue(worksheet, row, 1, 2, label, true);
        worksheet.getCell(row, 3).value = ":";
        styleCell(worksheet.getCell(row, 3), { align: "center" });
        setMergedValue(worksheet, row, 4, 9, value);
        worksheet.getRow(row).height = 22;
    }

    const headerRow = 11;
    const headers = ["NO", "TAHAPAN & TITIK KRITIS PENGUJIAN", "", "KRITERIA KESESUAIAN", "YA", "TIDAK", "N/A", "CATATAN / TINDAKAN KETIDAKSESUAIAN", "PARAF PENGUJI"];
    headers.forEach((header, index) => {
        const cell = worksheet.getCell(headerRow, index + 1);
        cell.value = header;
        styleCell(cell, { bold: true, fill: "FFE2E8F0", align: "center" });
    });
    worksheet.mergeCells(headerRow, 2, headerRow, 3);
    worksheet.getRow(headerRow).height = 32;

    const signatureImageId = workbook.addImage({
        base64: signature.base64,
        extension: signature.extension,
    });

    let rowIndex = headerRow + 1;
    let itemNumber = 0;
    for (const section of CHECKLIST_SECTIONS) {
        setMergedValue(worksheet, rowIndex, 1, 9, section.title.toUpperCase(), true);
        worksheet.getCell(rowIndex, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCEBFA" } };
        worksheet.getRow(rowIndex).height = 22;
        rowIndex += 1;

        for (const item of section.items) {
            itemNumber += 1;
            const answer = record.checklist[item.key];
            const row = worksheet.getRow(rowIndex);
            row.height = 42;
            worksheet.getCell(rowIndex, 1).value = itemNumber;
            styleCell(worksheet.getCell(rowIndex, 1), { align: "center" });
            worksheet.mergeCells(rowIndex, 2, rowIndex, 3);
            worksheet.getCell(rowIndex, 2).value = item.name;
            styleCell(worksheet.getCell(rowIndex, 2), { bold: true });
            worksheet.getCell(rowIndex, 3).border = thinBorder;
            worksheet.getCell(rowIndex, 4).value = item.criteria;
            styleCell(worksheet.getCell(rowIndex, 4));
            worksheet.getCell(rowIndex, 5).value = answer?.status === "ya" ? "✓" : "";
            worksheet.getCell(rowIndex, 6).value = answer?.status === "tidak" ? "✓" : "";
            worksheet.getCell(rowIndex, 7).value = answer?.status === "na" ? "✓" : "";
            [5, 6, 7].forEach((column) => styleCell(worksheet.getCell(rowIndex, column), { align: "center" }));
            worksheet.getCell(rowIndex, 8).value = answer?.note ?? item.note ?? "";
            styleCell(worksheet.getCell(rowIndex, 8));
            styleCell(worksheet.getCell(rowIndex, 9), { align: "center" });
            worksheet.addImage(signatureImageId, `I${rowIndex}:I${rowIndex + 1}`);
            rowIndex += 1;
        }
    }

    rowIndex += 1;
    setMergedValue(worksheet, rowIndex, 1, 9, "VERIFIKASI & TANDA TANGAN", true);
    worksheet.getCell(rowIndex, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    rowIndex += 1;
    setMergedValue(worksheet, rowIndex, 1, 9, `Catatan Evaluasi / Rekomendasi: ${record.catatanEvaluasi || "-"}`);
    worksheet.getRow(rowIndex).height = 48;
    rowIndex += 2;

    worksheet.mergeCells(rowIndex, 1, rowIndex, 4);
    worksheet.getCell(rowIndex, 1).value = "Mengetahui,\nKetua Tim Mikrobiologi";
    worksheet.getCell(rowIndex, 1).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    worksheet.getCell(rowIndex, 1).font = { name: "Arial", size: 9, bold: true };
    worksheet.mergeCells(rowIndex, 6, rowIndex, 9);
    worksheet.getCell(rowIndex, 6).value = "Diverifikasi oleh Penyelia,";
    worksheet.getCell(rowIndex, 6).alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    worksheet.getCell(rowIndex, 6).font = { name: "Arial", size: 9, bold: true };
    worksheet.getRow(rowIndex).height = 32;
    rowIndex += 1;

    worksheet.mergeCells(rowIndex, 1, rowIndex, 4);
    worksheet.getCell(rowIndex, 1).value = record.pengujiNama || "-";
    worksheet.getCell(rowIndex, 1).alignment = { horizontal: "center", vertical: "bottom" };
    worksheet.getCell(rowIndex, 1).font = { name: "Arial", size: 9, bold: true, underline: true };
    worksheet.mergeCells(rowIndex, 6, rowIndex, 9);
    worksheet.getCell(rowIndex, 6).value = record.penyelia || "-";
    worksheet.getCell(rowIndex, 6).alignment = { horizontal: "center", vertical: "bottom" };
    worksheet.getCell(rowIndex, 6).font = { name: "Arial", size: 9, bold: true, underline: true };

    worksheet.views = [{ state: "frozen", ySplit: headerRow }];
    worksheet.pageSetup.printArea = `A1:I${rowIndex}`;
    worksheet.pageSetup.printTitlesRow = `${headerRow}:${headerRow}`;

    const fileDate = record.tanggalPengujian.replaceAll("-", "");
    const buffer = await workbook.xlsx.writeBuffer();
    const file = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Checklist_Pengendalian_Mutu_${fileDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}
