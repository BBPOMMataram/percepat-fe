import axios from "axios";

export const PENGUJIAN_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL_PENGUJIAN || "http://localhost:8008";

export const pengujianApi = axios.create({
    baseURL: PENGUJIAN_BASE_URL,
    headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
    },
});

export interface PengujianItemData {
    [key: string]: any;
}

export interface PengujianItem {
    id: number;
    batch_id: string;
    file_group_id?: string;
    filename?: string;
    sheet_name?: string;
    row_number: number;
    code?: string;
    display_title?: string;
    qr_token: string;
    qr_content?: string;
    qr_content_display?: string;
    target_url?: string;
    qr_svg_small?: string;
    qr_svg_large?: string;
    qr_base64?: string;
    data: PengujianItemData;
    created_at?: string;
    updated_at?: string;
}

export interface BatchItem {
    batch_id: string;
    file_group_id?: string;
    filename?: string;
    sheet_name?: string;
    created_at?: string;
    total_items: number;
}

export interface PengujianResponseData {
    success: boolean;
    items: PengujianItem[];
    batches: BatchItem[];
    selectedBatchId: string | null;
    currentBatch: BatchItem | null;
    siblingSheets: BatchItem[];
    headers: string[];
    totalOverall: number;
    dbError?: string | null;
    message?: string;
}

export const pengujianService = {
    // 1. Fetch data items, batches & stats
    async getData(batchId?: string, query?: string): Promise<PengujianResponseData> {
        const params: Record<string, string> = {};
        if (batchId) params.batch = batchId;
        if (query) params.q = query;

        const res = await pengujianApi.get<PengujianResponseData>("/api/pengujian", {
            params,
        });
        return res.data;
    },

    // 2. Upload file (xlsx, xls, csv, pdf)
    async uploadFile(file: File): Promise<{ success: boolean; message: string; batch_id?: string; count?: number }> {
        const formData = new FormData();
        formData.append("excel_file", file);

        const res = await pengujianApi.post("/api/pengujian/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return res.data;
    },

    // 3. Quick load sample data (2col, full, pdf)
    async loadSample(type: "2col" | "full" | "pdf"): Promise<{ success: boolean; message: string; batch_id?: string; count?: number }> {
        const endpoint = `/api/pengujian/load-sample-${type}`;
        const res = await pengujianApi.post(endpoint);
        return res.data;
    },

    // 4. Delete specific batch
    async deleteBatch(batchId: string): Promise<{ success: boolean; message: string }> {
        const res = await pengujianApi.delete(`/api/pengujian/batch/${batchId}`);
        return res.data;
    },

    // 5. Clear all database records
    async clearAll(): Promise<{ success: boolean; message: string }> {
        const res = await pengujianApi.post("/api/pengujian/clear-all");
        return res.data;
    },

    // URL Helpers for Downloads & PDFs
    getTemplateDownloadUrl(type: "2col" | "full"): string {
        return `${PENGUJIAN_BASE_URL}/download-template-${type}`;
    },

    getBatchPdfUrl(batchId: string): string {
        return `${PENGUJIAN_BASE_URL}/batch/${batchId}/pdf-all`;
    },

    getFileGroupPdfUrl(fileGroupId: string): string {
        return `${PENGUJIAN_BASE_URL}/file-group/${fileGroupId}/pdf-merged`;
    },

    getItemPdfUrl(id: number): string {
        return `${PENGUJIAN_BASE_URL}/item/${id}/pdf`;
    },

    getItemFpdfUrl(id: number): string {
        return `${PENGUJIAN_BASE_URL}/item/${id}/pdf-fpdf`;
    },

    getScanUrl(qrToken: string): string {
        return `${PENGUJIAN_BASE_URL}/scan/${qrToken}`;
    },

    getQrImageUrl(qrToken: string): string {
        return `${PENGUJIAN_BASE_URL}/qr/${qrToken}`;
    },
};
