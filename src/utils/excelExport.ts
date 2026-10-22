import * as XLSX from 'xlsx';

export interface ExcelColumnDef<T = any> {
    header: string;
    key: string;
    width?: number;
    formatter?: (value: any, row: T, index: number) => any;
}

export function exportJsonToExcel<T = any>({
    data,
    columns,
    fileName,
    sheetName = 'Sheet1',
}: {
    data: T[];
    columns: ExcelColumnDef<T>[];
    fileName: string;
    sheetName?: string;
}) {
    const formattedRows = data.map((row, index) => {
        const rowObj: Record<string, any> = {};
        columns.forEach((col) => {
            const rawVal = (row as any)[col.key];
            rowObj[col.header] = col.formatter ? col.formatter(rawVal, row, index) : (rawVal ?? '');
        });
        return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);

    worksheet['!cols'] = columns.map((col) => ({
        wch: col.width || Math.max(col.header.length + 4, 12),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
