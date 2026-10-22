export type {
    PengujianItem,
    PengujianItemData,
    BatchItem,
    PengujianResponseData,
} from "./pengujianService";

export interface QrModalData {
    isOpen: boolean;
    qrToken: string;
    title: string;
    code: string;
    info: string;
    targetUrl: string;
    pdfUrl: string;
    fpdfUrl?: string;
    qrBase64?: string;
}
