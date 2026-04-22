"use client"

import LoadingWithoutText from "@/components/main/loading/LoadingWithoutText"
import { RootState } from "@/redux/store"
import api from "@/utils/api"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import ContentPemeliharaanAll from "./ContentPemeliharaanAll"
import ModalDetailPemeliharaan from "./detail/ModalDetailPemeliharaan"

// Helper: fetch batch user dan kembalikan authMap
const fetchAuthMap = async (ids: string[]): Promise<Record<string, any>> => {
    if (ids.length === 0) return {};
    try {
        const res = await api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`,
            { ids }
        );
        return Object.fromEntries((res.data as any[]).map((u) => [u.id, u]));
    } catch {
        return {};
    }
};

// Helper: merge pelapor dengan authMap
const mergePelapor = (items: any[], authMap: Record<string, any>) =>
    items.map((item) => ({
        ...item,
        pelapor: item.pelapor
            ? { ...item.pelapor, auth_user: authMap[item.pelapor.external_user_id] ?? null }
            : null,
    }));

// Helper: extract unique external_user_ids dari array items (dari field pelapor)
const extractPelaporIds = (items: any[]): string[] =>
    [...new Set(items.map((item: any) => item.pelapor?.external_user_id).filter(Boolean))];

// Helper: extract unique external_user_ids dari disposisi (from_user, to_user, pelapor)
const extractDisposisiIds = (items: any[]): string[] => {
    const ids = items.flatMap((item: any) => {
        const fromToIds =
            item.disposisi_new_pemeliharaan?.flatMap((d: any) => [
                d.from_user?.external_user_id,
                d.to_user?.external_user_id,
            ]) ?? [];
        return [...fromToIds, item.pelapor?.external_user_id ?? null];
    });
    return [...new Set(ids.filter(Boolean))];
};

export default function PemeliharaanSimpelBmn() {
    const [dataAll, setDataAll] = useState<any>(null);
    const [mergedDataAll, setMergedDataAll] = useState<any[]>([]);
    const [dataAnda, setDataAnda] = useState<any>(null);
    const [mergedDataAnda, setMergedDataAnda] = useState<any[]>([]);
    const [mergedDisposisi, setMergedDisposisi] = useState<any>(null);
    const [showModalDetailPemeliharaan, setShowModalDetailPemeliharaan] = useState(false);
    const [code, setCode] = useState<string>("");
    const [statusFilterAnda, setStatusFilterAnda] = useState<string>("all");
    const [statusFilterDisposisi, setStatusFilterDisposisi] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(false);

    const { user } = useSelector((state: RootState) => state.auth);
    const currentUserId = user?.id;

    // Ref untuk mencegah double-fetch saat strict mode React
    const hasFetchedRef = useRef(false);

    // ─── Fetch functions ──────────────────────────────────────────────────────

    const fetchAllData = useCallback(async (status?: string) => {
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-all`;
        if (status && status !== "all") url += `?status=${status}`;
        const res = await api.get(url);
        return res?.data ?? null;
    }, []);

    const fetchAndaData = useCallback(async (status?: string, perPage?: string) => {
        const params = new URLSearchParams();
        if (status && status !== "all") params.append("status", status);
        if (perPage) params.append("per_page", perPage);
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-by-user`;
        const qs = params.toString();
        if (qs) url += `?${qs}`;
        const res = await api.get(url);
        return res?.data ?? null;
    }, []);

    const fetchDisposisiData = useCallback(async (status?: string, perPage?: string) => {
        const params = new URLSearchParams();
        if (status && status !== "all") params.append("status", status);
        if (perPage) params.append("per_page", perPage);
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-disposition-by-user`;
        const qs = params.toString();
        if (qs) url += `?${qs}`;
        const res = await api.get(url);
        return res?.data ?? null;
    }, []);

    // ─── Merge helpers (menerima authMap dari luar, tidak fetch sendiri) ──────

    const applyMergeAll = (rawData: any, authMap: Record<string, any>) => {
        const items: any[] = rawData?.data ?? rawData ?? [];
        if (!Array.isArray(items) || items.length === 0) return [];
        return mergePelapor(items, authMap);
    };

    const applyMergeAnda = (rawData: any, authMap: Record<string, any>) => {
        const items: any[] = rawData?.data ?? rawData ?? [];
        if (!Array.isArray(items) || items.length === 0) return [];
        return mergePelapor(items, authMap);
    };

    const applyMergeDisposisi = (rawData: any, authMap: Record<string, any>) => {
        const items: any[] = rawData?.data ?? rawData ?? [];
        if (!Array.isArray(items) || items.length === 0) return rawData;

        const merged = items.map((item: any) => ({
            ...item,
            pelapor: item.pelapor
                ? { ...item.pelapor, auth_user: authMap[item.pelapor.external_user_id] ?? null }
                : null,
            disposisi_new_pemeliharaan:
                item.disposisi_new_pemeliharaan?.map((d: any) => ({
                    ...d,
                    from_user: { ...d.from_user, auth_user: authMap[d.from_user?.external_user_id] ?? null },
                    to_user: { ...d.to_user, auth_user: authMap[d.to_user?.external_user_id] ?? null },
                })) ?? [],
        }));

        return rawData?.data ? { ...rawData, data: merged } : merged;
    };

    // ─── Merge disposisi mandiri (untuk handleUpdateDataDisposisi) ────────────

    const mergeDisposisiData = useCallback(async (rawData: any) => {
        const items: any[] = rawData?.data ?? rawData ?? [];
        if (!Array.isArray(items) || items.length === 0) {
            setMergedDisposisi(rawData);
            return;
        }
        const authMap = await fetchAuthMap(extractDisposisiIds(items));
        setMergedDisposisi(applyMergeDisposisi(rawData, authMap));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Initial fetch — 3 data fetch paralel, lalu 1x get-user-batch ────────

    const loadAllData = useCallback(async () => {
        if (!currentUserId) return;
        setIsLoading(true);
        try {
            const [rawAll, rawAnda, rawDisposisi] = await Promise.all([
                fetchAllData(),
                fetchAndaData(statusFilterAnda),
                fetchDisposisiData(statusFilterDisposisi),
            ]);

            setDataAll(rawAll);
            setDataAnda(rawAnda);

            // Kumpulkan semua IDs dari ketiga data sekaligus
            const itemsAll: any[] = rawAll?.data ?? rawAll ?? [];
            const itemsAnda: any[] = rawAnda?.data ?? rawAnda ?? [];
            const itemsDisposisi: any[] = rawDisposisi?.data ?? rawDisposisi ?? [];

            const allIds = [
                ...new Set([
                    ...extractPelaporIds(itemsAll),
                    ...extractPelaporIds(itemsAnda),
                    ...extractDisposisiIds(itemsDisposisi),
                ])
            ];

            // Hanya 1x get-user-batch untuk semua data
            const authMap = await fetchAuthMap(allIds);

            setMergedDataAll(applyMergeAll(rawAll, authMap));
            setMergedDataAnda(applyMergeAnda(rawAnda, authMap));
            setMergedDisposisi(applyMergeDisposisi(rawDisposisi, authMap));
        } catch (err) {
            console.error("loadAllData error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!currentUserId || hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        loadAllData();
    }, [currentUserId, loadAllData]);

    // ─── Handler untuk update data disposisi setelah aksi (disposisi baru, dll) ──

    const handleUpdateDataDisposisi = useCallback(
        async (status?: string, perPage?: string) => {
            const resolvedStatus = status ?? statusFilterDisposisi;
            setIsLoading(true);
            try {
                const rawDisposisi = await fetchDisposisiData(resolvedStatus, perPage);
                await mergeDisposisiData(rawDisposisi);
            } catch (err) {
                console.error("handleUpdateDataDisposisi error:", err);
            } finally {
                setIsLoading(false);
            }
        },
        [statusFilterDisposisi, fetchDisposisiData, mergeDisposisiData]
    );

    // ─── Modal ────────────────────────────────────────────────────────────────

    const handleOpenDetail = useCallback((code: string) => {
        setCode(code);
        setShowModalDetailPemeliharaan(true);
    }, []);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div>
            <div className="tabs tabs-lift">
                <label className="tab">
                    <input type="radio" name="my_tabs_4" defaultChecked />
                    <span className="material-symbols-outlined">assignment</span>
                    Pemeliharaan
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6 relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center">
                            <LoadingWithoutText />
                        </div>
                    )}
                    <ContentPemeliharaanAll
                        dataAll={dataAll}
                        handleOpenDetail={handleOpenDetail}
                        setDataAll={setDataAll}
                        isLoading={isLoading}
                        setIsloading={setIsLoading}
                    />
                </div>
            </div>

            <div
                className="fixed bottom-4 lg:bottom-8 right-4 lg:right-8 tooltip tooltip-left"
                data-tip="Create New"
            >
                <Link
                    href="/simpel-bmn/pemeliharaan/form"
                    className="btn btn-primary btn-floating btn-circle hover:scale-110 hover:rotate-90 transition-all duration-200 ease-in-out"
                >
                    <span className="material-symbols-outlined">add</span>
                </Link>
            </div>

            <ModalDetailPemeliharaan
                show={showModalDetailPemeliharaan}
                onClose={() => setShowModalDetailPemeliharaan(false)}
                code={code}
                updateDataDisposisi={handleUpdateDataDisposisi}
            />
        </div>
    );
}
