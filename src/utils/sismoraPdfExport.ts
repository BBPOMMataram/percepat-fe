import { jsPDF } from "jspdf";

export interface SismoraPdfDayData {
    day: number;
    temp: number | null;
    hum: number | null;
}

export interface SismoraPdfExportOptions {
    roomName: string;
    monthYearStr: string; // e.g. "Oktober 2026"
    tempRequirement: string; // e.g. "15 - 28 °C"
    humRequirement: string; // e.g. "40 - 60%, sesuai IKJM 6.3/BBPOM MTR/20"
    penyelia: string;
    penanggungJawab: string;
    formCode?: string; // e.g. "F-6.3 (04) Rev 02"
    shift1Data: SismoraPdfDayData[]; // 31 days
    shift2Data: SismoraPdfDayData[]; // 31 days
    daysInMonth: number; // e.g. 30 or 31
}

export function generateSismoraF63Pdf(options: SismoraPdfExportOptions): jsPDF {
    const {
        roomName,
        monthYearStr,
        tempRequirement,
        humRequirement,
        penyelia,
        penanggungJawab,
        formCode = "F-6.3 (04) Rev 02",
        shift1Data,
        shift2Data,
        daysInMonth = 31,
    } = options;

    // Legal Landscape: 1008 pt x 612 pt
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [1008, 612],
    });

    const pageWidth = 1008;
    const pageHeight = 612;

    // 1. Outer Border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.75);
    doc.rect(45, 22, pageWidth - 90, pageHeight - 44);

    // 2. Title & Form Code Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FORM PEMANTAUAN SUHU DAN KELEMBABAN", pageWidth / 2, 42, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(formCode, pageWidth - 60, 42, { align: "right" });

    // 3. Information Block (Room, Month, Requirements)
    const infoLeftX = 65;
    let currY = 60;
    doc.setFontSize(9);

    // Row 1: Nama Ruangan
    doc.setFont("helvetica", "normal");
    doc.text("Nama Ruangan", infoLeftX, currY);
    doc.text(":", infoLeftX + 130, currY);
    doc.setFont("helvetica", "bold");
    doc.text(roomName || "-", infoLeftX + 145, currY);

    // Row 2: Bulan Pemantauan
    currY += 13;
    doc.setFont("helvetica", "normal");
    doc.text("Bulan Pemantauan", infoLeftX, currY);
    doc.text(":", infoLeftX + 130, currY);
    doc.text(monthYearStr || "-", infoLeftX + 145, currY);

    // Row 3: Suhu yang dipersyaratkan
    currY += 13;
    doc.text("Suhu dan Kelembaban", infoLeftX, currY);
    doc.text(":", infoLeftX + 130, currY);
    doc.text("Suhu", infoLeftX + 145, currY);
    doc.text("=", infoLeftX + 210, currY);
    doc.text(tempRequirement || "-", infoLeftX + 225, currY);

    // Row 4: Kelembaban yang dipersyaratkan
    currY += 13;
    doc.text("Yang dipersyaratkan", infoLeftX, currY);
    doc.text("Kelembaban", infoLeftX + 145, currY);
    doc.text("=", infoLeftX + 210, currY);
    doc.text(humRequirement || "-", infoLeftX + 225, currY);

    // 4. Grid Geometry Helper
    // Table spans from x = 55 to x = 953 (width = 898 pt)
    const tableX = 55;
    const colLeftWidth = 46; // for "Suhu (°C)" and values 31..20
    const colDayWidth = 26; // for each day 1..31 (31 * 26 = 806 pt)
    const colRightWidth = 46; // for "% rH", values 85..30, and "Tanggal"
    const tableWidth = colLeftWidth + 31 * colDayWidth + colRightWidth; // 46 + 806 + 46 = 898 pt

    const headerRowHeight = 13; // Row 0 (Suhu (°C) / % rH)
    const numLevelRows = 12; // Rows 1..12 (Levels 31..20 and 85..30)
    const levelRowHeight = 11.5;
    const levelsHeight = numLevelRows * levelRowHeight; // 138 pt
    const dateRowHeight = 13; // Row 13 (Days 1..31 / Tanggal)
    const tableHeight = headerRowHeight + levelsHeight + dateRowHeight; // 164 pt

    const tempLevels = [31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20];
    const humLevels = [85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30];

    const drawShiftTable = (
        shiftTitle: string,
        yStart: number,
        shiftData: SismoraPdfDayData[]
    ) => {
        const x0 = tableX;
        const x1 = x0 + colLeftWidth; // 101
        const x2 = x1 + 31 * colDayWidth; // 907
        const x3 = x2 + colRightWidth; // 953

        const y0 = yStart;
        const y1 = y0 + headerRowHeight; // y0 + 13
        const y2 = y1 + levelsHeight; // y1 + 138
        const y3 = y2 + dateRowHeight; // y2 + 13

        // Shift title above table
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(shiftTitle, x0, y0 - 3);

        // Pre-fill columns for invalid days (e.g. day 31 in a 30-day month) or dimmed days
        for (let d = 1; d <= 31; d++) {
            const isInvalidDay = d > daysInMonth;
            const dataEntry = shiftData.find((it) => it.day === d);
            const hasData = !!(dataEntry && (dataEntry.temp != null || dataEntry.hum != null));
            const dayCellX = x1 + (d - 1) * colDayWidth;

            if (isInvalidDay) {
                doc.setFillColor(238, 240, 244);
                doc.rect(dayCellX, y0, colDayWidth, tableHeight, "F");
            } else if (!hasData) {
                // Subtle dimmed background for days with no recorded data
                doc.setFillColor(252, 253, 255);
                doc.rect(dayCellX, y1, colDayWidth, levelsHeight, "F");
            }
        }

        // Outer Border Rectangle
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.75);
        doc.rect(x0, y0, tableWidth, tableHeight);

        // Horizontal Grid Lines (Spanning entire table width from x0 to x3)
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);

        // Line under header row
        doc.line(x0, y1, x3, y1);

        // Lines between level rows
        for (let r = 1; r < numLevelRows; r++) {
            const lineY = y1 + r * levelRowHeight;
            doc.line(x0, lineY, x3, lineY);
        }

        // Line under level 20 / 30 (above Date row)
        doc.line(x0, y2, x3, y2);

        // Vertical Grid Lines (Spanning entire table height from y0 to y3)
        // Line between Left Column (Suhu) and Day 1
        doc.line(x1, y0, x1, y3);

        // 30 lines between days 1..31
        for (let d = 1; d < 31; d++) {
            const lineX = x1 + d * colDayWidth;
            doc.line(lineX, y0, lineX, y3);
        }

        // Line between Day 31 and Right Column (% rH / Tanggal)
        doc.line(x2, y0, x2, y3);

        // -----------------------------------------------------------
        // CELL TEXT CONTENT
        // -----------------------------------------------------------
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);

        // Row 0: Header Row
        const headerBaselineY = y0 + 9.5;
        doc.text("Suhu (°C)", x0 + 3, headerBaselineY);
        doc.text("% rH", x2 + 3, headerBaselineY);

        // Rows 1..12: Level Numbers
        for (let r = 0; r < numLevelRows; r++) {
            const levelBaselineY = y1 + r * levelRowHeight + 8.5;

            // Suhu (°C) level on the left
            doc.text(String(tempLevels[r]), x0 + 8, levelBaselineY);

            // % rH level on the right
            doc.text(String(humLevels[r]), x2 + 3, levelBaselineY);
        }

        // Row 13: Date Numbers & "Tanggal" label
        const dateBaselineY = y2 + 9.5;
        for (let d = 1; d <= 31; d++) {
            const dayCenterX = x1 + (d - 0.5) * colDayWidth;
            doc.text(String(d), dayCenterX, dateBaselineY, { align: "center" });
        }
        doc.text("Tanggal", x2 + 3, dateBaselineY);

        // -----------------------------------------------------------
        // DRAW LINE CHARTS: Suhu (Biru) & Kelembaban (Hitam)
        // -----------------------------------------------------------
        const tempPoints: { x: number; y: number; val: number }[] = [];
        const humPoints: { x: number; y: number; val: number }[] = [];

        for (let d = 1; d <= Math.min(31, daysInMonth); d++) {
            const item = shiftData.find((it) => it.day === d);
            if (!item) continue;

            const cx = x1 + (d - 0.5) * colDayWidth;

            // Map temperature: range 20 to 31 (span = 11 levels across 11 row steps)
            if (item.temp != null && !isNaN(item.temp)) {
                const clampedTemp = Math.min(31, Math.max(20, item.temp));
                const fraction = (31 - clampedTemp) / 11;
                const cy = (y1 + 0.5 * levelRowHeight) + fraction * (11 * levelRowHeight);
                tempPoints.push({ x: cx, y: cy, val: item.temp });
            }

            // Map humidity: range 30 to 85 (span = 55 levels across 11 row steps)
            if (item.hum != null && !isNaN(item.hum)) {
                const clampedHum = Math.min(85, Math.max(30, item.hum));
                const fraction = (85 - clampedHum) / 55;
                const cy = (y1 + 0.5 * levelRowHeight) + fraction * (11 * levelRowHeight);
                humPoints.push({ x: cx, y: cy, val: item.hum });
            }
        }

        // 1. Draw Temperature Line (Blue)
        if (tempPoints.length > 0) {
            doc.setDrawColor(0, 80, 215); // Authentic Royal Blue
            doc.setLineWidth(1.4);

            for (let i = 0; i < tempPoints.length - 1; i++) {
                doc.line(tempPoints[i].x, tempPoints[i].y, tempPoints[i + 1].x, tempPoints[i + 1].y);
            }

            // Draw Blue Dots
            doc.setFillColor(0, 80, 215);
            for (const pt of tempPoints) {
                doc.circle(pt.x, pt.y, 2.2, "FD");
            }
        }

        // 2. Draw Humidity Line (Black)
        if (humPoints.length > 0) {
            doc.setDrawColor(15, 20, 25); // Solid Deep Black
            doc.setLineWidth(1.4);

            for (let i = 0; i < humPoints.length - 1; i++) {
                doc.line(humPoints[i].x, humPoints[i].y, humPoints[i + 1].x, humPoints[i + 1].y);
            }

            // Draw Black Dots
            doc.setFillColor(15, 20, 25);
            for (const pt of humPoints) {
                doc.circle(pt.x, pt.y, 1.8, "FD");
            }
        }
    };

    // 5. Draw Shift 1 Table (Pagi: 08.00 WITA)
    drawShiftTable("Shift 1 (Pagi) = 08.00 WITA", 117, shift1Data);

    // 6. Draw Shift 2 Table (Siang: 13.00 WITA)
    drawShiftTable("Shift 2 (Siang) = 13.00 WITA", 301, shift2Data);

    // 7. Footer: Legend & Signatures
    const footerY = 482;

    // Legend
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("*)", 55, footerY);

    // Blue Line Sample
    doc.setDrawColor(0, 80, 215);
    doc.setLineWidth(1.4);
    doc.line(68, footerY - 3, 88, footerY - 3);
    doc.setFillColor(0, 80, 215);
    doc.circle(78, footerY - 3, 2.2, "FD");

    doc.setFont("helvetica", "bold");
    doc.text("Biru", 94, footerY);
    doc.setFont("helvetica", "normal");
    doc.text(":", 122, footerY);
    doc.text("Suhu", 132, footerY);

    // Black Line Sample
    doc.setDrawColor(15, 20, 25);
    doc.setLineWidth(1.4);
    doc.line(68, footerY + 11, 88, footerY + 11);
    doc.setFillColor(15, 20, 25);
    doc.circle(78, footerY + 11, 1.8, "FD");

    doc.setFont("helvetica", "bold");
    doc.text("Hitam", 94, footerY + 14);
    doc.setFont("helvetica", "normal");
    doc.text(":", 122, footerY + 14);
    doc.text("Kelembaban", 132, footerY + 14);

    // Signatures
    const sigY = footerY + 30;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Left: Penyelia Laboratorium
    doc.text("Penyelia Laboratorium", 120, sigY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`( ${penyelia || "                                    "} )`, 120, sigY + 34, {
        align: "center",
    });

    // Right: Penanggung Jawab Ruangan
    doc.text("Penanggung Jawab Ruangan", pageWidth - 160, sigY, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`( ${penanggungJawab || "                                    "} )`, pageWidth - 160, sigY + 34, {
        align: "center",
    });

    return doc;
}
