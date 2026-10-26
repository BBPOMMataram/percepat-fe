"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { ModalGeneral } from "@/components/main/ModalGeneral";
import { showAlert } from "@/features/alertSlice";

type CategoryType = "reagen" | "baku-pembanding" | "atk" | "perlengkapan-kebersihan" | "suku-cadang";

interface PendingItem {
    id: number;
    categoryKey: CategoryType;
    categoryLabel: string;
    categoryBadgeColor: string;
    pemintaName: string;
    bidangName: string;
    katimName: string;
    statusId: number;
    statusName: string;
    tglPermintaan: string;
    tglPenyerahan?: string | null;
    original: any;
}

const CATEGORY_META: Record<CategoryType, { label: string; badgeClass: string; listEndpoint: string; verifKatimEndpoint: string; verifTuEndpoint: string; verifPetugasEndpoint: string }> = {
    reagen: {
        label: "Reagen",
        badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
        listEndpoint: "/api/v1/list-permintaan-reagen",
        verifKatimEndpoint: "/api/v1/verif-katim-reagen",
        verifTuEndpoint: "/api/v1/verif-kabagtu-reagen",
        verifPetugasEndpoint: "/api/v1/verif-petugas-reagen",
    },
    "baku-pembanding": {
        label: "Baku Pembanding",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
        listEndpoint: "/api/v1/list-permintaan-baku-pembanding",
        verifKatimEndpoint: "/api/v1/verif-katim-baku-pembanding",
        verifTuEndpoint: "/api/v1/verif-kabagtu-baku-pembanding",
        verifPetugasEndpoint: "/api/v1/verif-petugas-baku-pembanding",
    },
    atk: {
        label: "ATK",
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
        listEndpoint: "/api/v1/list-permintaan-atk",
        verifKatimEndpoint: "/api/v1/verif-katim-atk",
        verifTuEndpoint: "/api/v1/verif-kabagtu-atk",
        verifPetugasEndpoint: "/api/v1/verif-petugas-atk",
    },
    "perlengkapan-kebersihan": {
        label: "Perlengkapan Kebersihan",
        badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
        listEndpoint: "/api/v1/list-permintaan-perlengkapan-kebersihan",
        verifKatimEndpoint: "/api/v1/verif-katim-perlengkapan-kebersihan",
        verifTuEndpoint: "/api/v1/verif-kabagtu-perlengkapan-kebersihan",
        verifPetugasEndpoint: "/api/v1/verif-petugas-perlengkapan-kebersihan",
    },
    "suku-cadang": {
        label: "Suku Cadang",
        badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
        listEndpoint: "/api/v1/list-permintaan-suku-cadang",
        verifKatimEndpoint: "/api/v1/verif-katim-atk", // fallback
        verifTuEndpoint: "/api/v1/verif-kabagtu-atk", // fallback
        verifPetugasEndpoint: "/api/v1/verif-petugas-suku-cadang",
    },
};

export default function PendingVerifikasiSection() {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    const [items, setItems] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

    // Modal List Barang Detail
    const [modalListOpen, setModalListOpen] = useState(false);
    const [selectedItemForList, setSelectedItemForList] = useState<PendingItem | null>(null);
    const [detailListBarang, setDetailListBarang] = useState<any[]>([]);
    const [loadingDetailList, setLoadingDetailList] = useState(false);

    // Modal Verifikasi Khusus Admin (dengan Tanggal Penyerahan & Realisasi)
    const [modalAdminOpen, setModalAdminOpen] = useState(false);
    const [adminTargetItem, setAdminTargetItem] = useState<PendingItem | null>(null);
    const [adminListBarang, setAdminListBarang] = useState<any[]>([]);
    const [tglPenyerahan, setTglPenyerahan] = useState<string>(dayjs().format("YYYY-MM-DD"));
    const [jumlahRealisasi, setJumlahRealisasi] = useState<number[]>([]);
    const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

    // Identifikasi peran user
    const isKabagTu = user?.employee?.group_jabatan_id === 2;
    const isSuperadmin = user?.role?.level === "superadmin";
    const isAdminPercepat =
        isSuperadmin ||
        (user?.role?.level === "admin" &&
            Array.isArray(user?.sites) &&
            user.sites.some((s: any) => Number(s?.id) === 1)) ||
        !!(user as any)?.is_admin;

    const loadPendingData = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        const collected: PendingItem[] = [];

        try {
            // =========================================================================
            // 1. JIKA USER ADALAH ADMIN / PETUGAS:
            //    Mengambil permintaan dengan status_id === 3 (Disetujui Kabag TU, Menunggu Verif Petugas)
            // =========================================================================
            if (isAdminPercepat) {
                const adminPromises = [
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-reagen?per_page=100`).catch(() => ({ data: null })),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-baku-pembanding?per_page=100`).catch(() => ({ data: null })),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-atk?per_page=100`).catch(() => ({ data: null })),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-perlengkapan-kebersihan?per_page=100`).catch(() => ({ data: null })),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-suku-cadang?per_page=100`).catch(() => ({ data: null })),
                ];

                const [resReagen, resBaku, resAtk, resPerlengkapan, resSukuCadang] = await Promise.all(adminPromises);

                const mapAdminData = (res: any, key: CategoryType) => {
                    const dataArray = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
                    dataArray.forEach((item: any) => {
                        // Hanya ambil yang berstatus 3 (Menunggu Verifikasi & Penyerahan Petugas)
                        if (item.status_id === 3) {
                            collected.push({
                                id: item.id,
                                categoryKey: key,
                                categoryLabel: CATEGORY_META[key].label,
                                categoryBadgeColor: CATEGORY_META[key].badgeClass,
                                pemintaName: item.peminta?.name || item.pemohon || item.peminta_name || "Pemohon",
                                bidangName: item.bidang?.name || item.bidang_name_auth_external || "-",
                                katimName: item.bidang?.user?.name || item.katim?.name || "-",
                                statusId: item.status_id,
                                statusName: item.status?.name || "Menunggu Penyerahan Petugas",
                                tglPermintaan: item.tgl_permintaan,
                                tglPenyerahan: item.tgl_penyerahan,
                                original: item,
                            });
                        }
                    });
                };

                mapAdminData(resReagen, "reagen");
                mapAdminData(resBaku, "baku-pembanding");
                mapAdminData(resAtk, "atk");
                mapAdminData(resPerlengkapan, "perlengkapan-kebersihan");
                mapAdminData(resSukuCadang, "suku-cadang");
            }

            // =========================================================================
            // 2. JIKA USER ADALAH KEPALA TU (group_jabatan_id === 2):
            //    Mengambil permintaan dengan status_id === 2 (Disetujui KaTim, Menunggu Verif Kabag TU)
            // =========================================================================
            if (isKabagTu) {
                const tuPromises = [
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-reagen?is_kabagtu=1&per_page=100`).catch(() => ({ data: null })),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-baku-pembanding?is_kabagtu=1&per_page=100`).catch(() => ({ data: null })),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-atk?is_kabagtu=1&per_page=100`).catch(() => ({ data: null })),
                    api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-perlengkapan-kebersihan?is_kabagtu=1&per_page=100`).catch(() => ({ data: null })),
                ];

                const [resReagenTu, resBakuTu, resAtkTu, resPerlengkapanTu] = await Promise.all(tuPromises);

                const mapTuData = (res: any, key: CategoryType) => {
                    const dataArray = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
                    dataArray.forEach((item: any) => {
                        // 1. Ambil status 2 untuk Kabag TU
                        if (item.status_id === 2) {
                            collected.push({
                                id: item.id,
                                categoryKey: key,
                                categoryLabel: CATEGORY_META[key].label,
                                categoryBadgeColor: CATEGORY_META[key].badgeClass,
                                pemintaName: item.peminta?.name || item.pemohon || item.peminta_name || "Pemohon",
                                bidangName: item.bidang?.name || item.bidang_name_auth_external || "-",
                                katimName: item.bidang?.user?.name || item.katim?.name || "-",
                                statusId: item.status_id,
                                statusName: item.status?.name || "Menunggu Verifikasi Kabag TU",
                                tglPermintaan: item.tgl_permintaan,
                                tglPenyerahan: item.tgl_penyerahan,
                                original: item,
                            });
                        }

                        // 2. Jika item berstatus 1 dan Kabag TU ini juga bertindak sebagai KaTim untuk permintaan ini
                        const isMatchKatim =
                            Boolean(
                                user?.id &&
                                item.katim?.external_user_id &&
                                String(item.katim.external_user_id).toLowerCase() === String(user.id).toLowerCase()
                            ) ||
                            Boolean(
                                user?.id &&
                                item.katim_selected &&
                                String(item.katim_selected).toLowerCase() === String(user.id).toLowerCase()
                            );

                        if (item.status_id === 1 && isMatchKatim) {
                            collected.push({
                                id: item.id,
                                categoryKey: key,
                                categoryLabel: CATEGORY_META[key].label,
                                categoryBadgeColor: CATEGORY_META[key].badgeClass,
                                pemintaName: item.peminta?.name || item.pemohon || item.peminta_name || "Pemohon",
                                bidangName: item.bidang?.name || item.bidang_name_auth_external || "-",
                                katimName: item.bidang?.user?.name || item.katim?.name || "-",
                                statusId: item.status_id,
                                statusName: item.status?.name || "Menunggu Verifikasi KaTim",
                                tglPermintaan: item.tgl_permintaan,
                                tglPenyerahan: item.tgl_penyerahan,
                                original: item,
                            });
                        }
                    });
                };

                mapTuData(resReagenTu, "reagen");
                mapTuData(resBakuTu, "baku-pembanding");
                mapTuData(resAtkTu, "atk");
                mapTuData(resPerlengkapanTu, "perlengkapan-kebersihan");
            }

            // =========================================================================
            // 3. JIKA USER ADALAH KATIM (Termasuk Kepala TU yang merangkap sebagai KaTim):
            //    Mengambil permintaan dengan status_id === 1 (Menunggu Verifikasi KaTim)
            //    HANYA data milik Katim tersebut yang dimunculkan!
            // =========================================================================
            const katimPromises = [
                api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-reagen?katim_id=${user.id}&is_kabagtu=0&per_page=100`).catch(() => ({ data: null })),
                api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-baku-pembanding?katim_id=${user.id}&is_kabagtu=0&per_page=100`).catch(() => ({ data: null })),
                api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-atk?katim_id=${user.id}&is_kabagtu=0&per_page=100`).catch(() => ({ data: null })),
                api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-perlengkapan-kebersihan?katim_id=${user.id}&is_kabagtu=0&per_page=100`).catch(() => ({ data: null })),
            ];

            const [resReagenKatim, resBakuKatim, resAtkKatim, resPerlengkapanKatim] = await Promise.all(katimPromises);

            const mapKatimData = (res: any, key: CategoryType) => {
                const dataArray = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
                dataArray.forEach((item: any) => {
                    // Pastikan status 1 dan milik Katim yang sedang login
                    const isMatchKatim =
                        Boolean(
                            user?.id &&
                            item.katim?.external_user_id &&
                            String(item.katim.external_user_id).toLowerCase() === String(user.id).toLowerCase()
                        ) ||
                        Boolean(
                            user?.id &&
                            item.katim_selected &&
                            String(item.katim_selected).toLowerCase() === String(user.id).toLowerCase()
                        );

                    if (item.status_id === 1 && isMatchKatim) {
                        collected.push({
                            id: item.id,
                            categoryKey: key,
                            categoryLabel: CATEGORY_META[key].label,
                            categoryBadgeColor: CATEGORY_META[key].badgeClass,
                            pemintaName: item.peminta?.name || item.pemohon || item.peminta_name || "Pemohon",
                            bidangName: item.bidang?.name || item.bidang_name_auth_external || "-",
                            katimName: item.bidang?.user?.name || item.katim?.name || "-",
                            statusId: item.status_id,
                            statusName: item.status?.name || "Menunggu Verifikasi KaTim",
                            tglPermintaan: item.tgl_permintaan,
                            tglPenyerahan: item.tgl_penyerahan,
                            original: item,
                        });
                    }
                });
            };

            mapKatimData(resReagenKatim, "reagen");
            mapKatimData(resBakuKatim, "baku-pembanding");
            mapKatimData(resAtkKatim, "atk");
            mapKatimData(resPerlengkapanKatim, "perlengkapan-kebersihan");

            // Deduplikasi berdasarkan ID dan Kategori (jika ada overlap)
            const uniqueMap = new Map<string, PendingItem>();
            collected.forEach((it) => {
                const uniqueKey = `${it.categoryKey}-${it.id}`;
                if (!uniqueMap.has(uniqueKey)) {
                    uniqueMap.set(uniqueKey, it);
                }
            });

            // Urutkan berdasarkan ID descending (terbaru di atas)
            const sorted = Array.from(uniqueMap.values()).sort((a, b) => b.id - a.id);
            setItems(sorted);
        } catch (err) {
            console.error("Gagal memuat daftar permintaan pending verifikasi:", err);
        } finally {
            setLoading(false);
        }
    }, [user, isAdminPercepat, isKabagTu]);

    useEffect(() => {
        loadPendingData();
    }, [loadPendingData]);

    // Aksi Klik Barang / Lihat List Barang
    const handleOpenListBarang = (item: PendingItem) => {
        setSelectedItemForList(item);
        setModalListOpen(true);
        setLoadingDetailList(true);

        const listUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}${CATEGORY_META[item.categoryKey].listEndpoint}/${item.id}`;
        api.get(listUrl)
            .then(({ data }) => {
                setDetailListBarang(data.data || (Array.isArray(data) ? data : []));
            })
            .catch((err) => {
                console.error("Gagal mengambil list barang:", err);
                setDetailListBarang([]);
            })
            .finally(() => setLoadingDetailList(false));
    };

    // Aksi Verifikasi KaTim (status_id === 1)
    const handleVerifKatim = (item: PendingItem) => {
        if (!window.confirm(`Verifikasi permintaan #${item.id} (${item.categoryLabel}) sebagai KaTim?`)) return;

        const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}${CATEGORY_META[item.categoryKey].verifKatimEndpoint}/${item.id}`;
        api.post(endpoint)
            .then((res) => {
                dispatch(showAlert({ type: "success", message: res.data?.message || "Berhasil diverifikasi sebagai KaTim", description: "Permintaan diteruskan ke Kabag TU" }));
                setModalListOpen(false);
                loadPendingData();
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message || "Gagal verifikasi", description: "Terjadi kesalahan saat memproses data" }));
            });
    };

    // Aksi Verifikasi Kabag TU (status_id === 2)
    const handleVerifKabagTu = (item: PendingItem) => {
        if (!window.confirm(`Verifikasi permintaan #${item.id} (${item.categoryLabel}) sebagai Kepala TU?`)) return;

        const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}${CATEGORY_META[item.categoryKey].verifTuEndpoint}/${item.id}`;
        api.post(endpoint, { user })
            .then((res) => {
                dispatch(showAlert({ type: "success", message: res.data?.message || "Berhasil diverifikasi sebagai Kabag TU", description: "Permintaan siap diserahkan oleh Petugas/Admin" }));
                setModalListOpen(false);
                loadPendingData();
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message || "Gagal verifikasi", description: "Terjadi kesalahan saat memproses data" }));
            });
    };

    // Aksi Membuka Modal Verifikasi Khusus Admin (status_id === 3)
    const handleOpenAdminVerifModal = (item: PendingItem) => {
        setAdminTargetItem(item);
        setTglPenyerahan(dayjs().format("YYYY-MM-DD"));
        setAdminListBarang([]);
        setJumlahRealisasi([]);
        setModalAdminOpen(true);

        const listUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}${CATEGORY_META[item.categoryKey].listEndpoint}/${item.id}`;
        api.get(listUrl)
            .then(({ data }) => {
                const list = data.data || (Array.isArray(data) ? data : []);
                setAdminListBarang(list);
                // Inisialisasi realisasi default sama dengan jumlah permintaan (atau jumlahrealisasi jika ada)
                const defaults = list.map((b: any) => Number(b.jumlahrealisasi ?? b.jumlahpermintaan ?? 1));
                setJumlahRealisasi(defaults);
            })
            .catch((err) => {
                console.error("Gagal mengambil list barang untuk admin:", err);
            });
    };

    // Aksi Submit Verifikasi & Penyerahan Admin
    const handleSubmitAdminVerif = () => {
        if (!adminTargetItem) return;
        if (!window.confirm(`Konfirmasi penyerahan dan verifikasi permintaan #${adminTargetItem.id}?`)) return;

        setIsSubmittingAdmin(true);
        const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}${CATEGORY_META[adminTargetItem.categoryKey].verifPetugasEndpoint}/${adminTargetItem.id}`;

        api.post(endpoint, {
            user,
            realisasi: jumlahRealisasi,
            tgl_penyerahan: tglPenyerahan,
        })
            .then((res) => {
                dispatch(showAlert({ type: "success", message: res.data?.message || "Verifikasi dan penyerahan barang berhasil!", description: "Stok inventaris telah diperbarui" }));
                setModalAdminOpen(false);
                setModalListOpen(false);
                loadPendingData();
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message || "Gagal memproses penyerahan", description: "Pastikan stok barang mencukupi" }));
            })
            .finally(() => setIsSubmittingAdmin(false));
    };

    // Filter kategori di UI
    const filteredItems = selectedCategoryFilter === "all" ? items : items.filter((it) => it.categoryKey === selectedCategoryFilter);

    // Hitung badge counter per kategori
    const countByCategory = (key: string) => {
        if (key === "all") return items.length;
        return items.filter((it) => it.categoryKey === key).length;
    };

    // Jika user belum login atau tidak ada permintaan yang perlu diverifikasi, section disembunyikan
    if (!user || (!loading && items.length === 0)) {
        return null;
    }

    return (
        <section className="bg-slate-50/70 border-b border-slate-200/80 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Tugas Verifikasi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                            <span className="material-symbols-outlined text-2xl">pending_actions</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                    Tugas Verifikasi Permintaan Barang
                                </h2>
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                                    {items.length}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Permintaan barang yang memerlukan tindakan persetujuan dan verifikasi dari Anda
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={loadPendingData}
                        disabled={loading}
                        className="btn btn-sm btn-ghost gap-1.5 self-start sm:self-center text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-white rounded-lg shadow-2xs"
                        title="Segarkan daftar"
                    >
                        <span className={`material-symbols-outlined text-base ${loading ? "animate-spin" : ""}`}>
                            refresh
                        </span>
                        <span className="text-xs">Segarkan</span>
                    </button>
                </div>

                {/* Filter Kategori Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs">
                    <button
                        type="button"
                        onClick={() => setSelectedCategoryFilter("all")}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                            selectedCategoryFilter === "all"
                                ? "bg-slate-900 text-white shadow-xs"
                                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                        }`}
                    >
                        <span>Semua Kategori</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategoryFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
                            {countByCategory("all")}
                        </span>
                    </button>

                    {(Object.keys(CATEGORY_META) as CategoryType[]).map((catKey) => {
                        const count = countByCategory(catKey);
                        if (count === 0) return null; // Sembunyikan chip jika 0
                        return (
                            <button
                                key={catKey}
                                type="button"
                                onClick={() => setSelectedCategoryFilter(catKey)}
                                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                                    selectedCategoryFilter === catKey
                                        ? "bg-slate-900 text-white shadow-xs"
                                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                                }`}
                            >
                                <span>{CATEGORY_META[catKey].label}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedCategoryFilter === catKey ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Daftar Card Permintaan */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs flex flex-col items-center justify-center">
                        <span className="loading loading-spinner loading-md text-slate-400 mb-2"></span>
                        <p className="text-xs font-medium">Memuat tugas verifikasi Anda...</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-500 shadow-xs">
                        <p className="text-sm">Tidak ada permintaan yang menunggu verifikasi pada filter ini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredItems.map((item) => (
                            <div
                                key={`${item.categoryKey}-${item.id}`}
                                className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                            >
                                <div>
                                    {/* Top badges */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${item.categoryBadgeColor}`}>
                                            {item.categoryLabel}
                                        </span>
                                        <span className="text-[11px] font-medium text-slate-600">
                                            {dayjs(item.tglPermintaan).format("DD MMM YYYY")}
                                        </span>
                                    </div>

                                    {/* Info Permintaan - Klik untuk melihat daftar barang */}
                                    <div
                                        onClick={() => handleOpenListBarang(item)}
                                        className="mb-2 p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                        title="Klik untuk melihat rincian barang yang diminta"
                                    >
                                        <div className="flex items-center justify-between gap-1.5">
                                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                Permintaan #{item.id}
                                            </span>
                                            <span className="text-[11px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                                Lihat Rincian &rarr;
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 mt-0.5">
                                            {item.pemintaName}
                                        </h3>
                                        <p className="text-xs text-slate-600 line-clamp-1">
                                            Bidang / Unit: <span className="font-medium text-slate-700">{item.bidangName}</span>
                                        </p>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="mb-3">
                                        {item.statusId === 1 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                                Menunggu Verif KaTim
                                            </span>
                                        )}
                                        {item.statusId === 2 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                                                Menunggu Verif Kabag TU
                                            </span>
                                        )}
                                        {item.statusId === 3 && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                                Menunggu Penyerahan Petugas
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                                    {/* Klik Barang / Lihat List Barang */}
                                    <button
                                        type="button"
                                        onClick={() => handleOpenListBarang(item)}
                                        className="btn btn-xs sm:btn-sm btn-ghost text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1 rounded-lg font-medium"
                                        title="Klik untuk melihat daftar barang yang diminta"
                                    >
                                        <span className="material-symbols-outlined text-base">format_list_bulleted</span>
                                        <span>Lihat Barang</span>
                                    </button>

                                    {/* Tombol Eksekusi Verifikasi sesuai peran */}
                                    {item.statusId === 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleVerifKatim(item)}
                                            className="btn btn-xs sm:btn-sm btn-success text-white font-semibold gap-1 rounded-lg shadow-2xs"
                                        >
                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                            <span>Verif KaTim</span>
                                        </button>
                                    )}

                                    {item.statusId === 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleVerifKabagTu(item)}
                                            className="btn btn-xs sm:btn-sm btn-info text-white font-semibold gap-1 rounded-lg shadow-2xs"
                                        >
                                            <span className="material-symbols-outlined text-base">verified</span>
                                            <span>Verif Kabag TU</span>
                                        </button>
                                    )}

                                    {/* Khusus Admin: Membuka popup untuk mengatur tanggal dan realisasi */}
                                    {item.statusId === 3 && (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenAdminVerifModal(item)}
                                            className="btn btn-xs sm:btn-sm btn-primary text-white font-semibold gap-1 rounded-lg shadow-2xs"
                                        >
                                            <span className="material-symbols-outlined text-base">local_shipping</span>
                                            <span>Verif & Serahkan</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* =========================================================================
                MODAL 1: LIHAT LIST BARANG PERMINTAAN
                Muncul saat user mengklik "Lihat Barang"
               ========================================================================= */}
            <ModalGeneral open={modalListOpen} onClose={() => setModalListOpen(false)}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                List Barang Permintaan #{selectedItemForList?.id}
                            </h3>
                            {selectedItemForList && (
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${selectedItemForList.categoryBadgeColor}`}>
                                    {selectedItemForList.categoryLabel}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pemohon: <span className="font-semibold text-slate-700">{selectedItemForList?.pemintaName}</span> ({selectedItemForList?.bidangName})
                        </p>
                    </div>
                </div>

                {loadingDetailList ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                        <span className="loading loading-spinner loading-md text-blue-600 mb-2"></span>
                        <p className="text-xs">Memuat detail barang...</p>
                    </div>
                ) : detailListBarang.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                        Tidak ada barang di dalam permintaan ini.
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 pr-1">
                        {detailListBarang.map((b: any, idx: number) => {
                            const barangObj = b.barang || b.suku_cadang || b.atk;
                            return (
                                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 p-2 rounded-lg transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {barangObj ? barangObj.name : `Barang (ID: ${b.barang_id || b.suku_cadang_id || b.atk_id || "-"})`}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                                            <span className="badge badge-sm badge-outline text-slate-600 font-medium">
                                                Minta: <strong className="text-slate-800 ml-1">{b.jumlahpermintaan || 1}</strong>
                                            </span>
                                            {b.jumlahrealisasi !== null && b.jumlahrealisasi !== undefined && (
                                                <span className="badge badge-sm badge-outline text-emerald-700 font-medium border-emerald-300">
                                                    Realisasi: <strong className="ml-1">{b.jumlahrealisasi}</strong>
                                                </span>
                                            )}
                                            <span className="badge badge-sm badge-outline text-slate-600 font-medium">
                                                Stok Gudang: <strong className="text-blue-700 ml-1">{barangObj?.stock ?? "-"}</strong>
                                            </span>
                                            <span className="badge badge-sm badge-outline text-slate-600 font-medium">
                                                Satuan: <span className="ml-1">{barangObj?.satuan || "-"}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {b.keterangan && (
                                        <span className="text-[11px] text-slate-500 italic max-w-xs text-right">
                                            Ket: {b.keterangan}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer Modal List */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setModalListOpen(false)}
                        className="btn btn-sm btn-ghost text-slate-600"
                    >
                        Tutup
                    </button>

                    {selectedItemForList?.statusId === 1 && (
                        <button
                            type="button"
                            onClick={() => handleVerifKatim(selectedItemForList)}
                            className="btn btn-sm btn-success text-white font-semibold gap-1"
                        >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            <span>Verif KaTim</span>
                        </button>
                    )}

                    {selectedItemForList?.statusId === 2 && (
                        <button
                            type="button"
                            onClick={() => handleVerifKabagTu(selectedItemForList)}
                            className="btn btn-sm btn-info text-white font-semibold gap-1"
                        >
                            <span className="material-symbols-outlined text-base">verified</span>
                            <span>Verif Kabag TU</span>
                        </button>
                    )}

                    {selectedItemForList?.statusId === 3 && (
                        <button
                            type="button"
                            onClick={() => {
                                setModalListOpen(false);
                                handleOpenAdminVerifModal(selectedItemForList);
                            }}
                            className="btn btn-sm btn-primary text-white font-semibold gap-1"
                        >
                            <span className="material-symbols-outlined text-base">local_shipping</span>
                            <span>Atur Tanggal & Serahkan</span>
                        </button>
                    )}
                </div>
            </ModalGeneral>

            {/* =========================================================================
                MODAL 2: POPUP VERIFIKASI KHUSUS ADMIN (ATUR TANGGAL & REALISASI STOK)
                Muncul saat Admin menekan tombol Verifikasi & Serahkan
               ========================================================================= */}
            <ModalGeneral open={modalAdminOpen} onClose={() => setModalAdminOpen(false)}>
                <div className="pb-3 border-b border-slate-100 mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Verifikasi & Penyerahan Barang Permintaan #{adminTargetItem?.id}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Pemohon: <span className="font-semibold text-slate-700">{adminTargetItem?.pemintaName}</span> ({adminTargetItem?.bidangName})
                    </p>
                </div>

                {/* Form Input Tanggal Penyerahan */}
                <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Penyerahan Barang :
                    </label>
                    <input
                        type="date"
                        value={tglPenyerahan}
                        onChange={(e) => setTglPenyerahan(e.target.value)}
                        className="input input-sm input-bordered bg-white text-slate-800 font-semibold rounded-lg w-full sm:w-auto"
                        required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                        *Secara default terisi tanggal hari ini. Dapat disesuaikan jika barang telah diserahkan sebelumnya.
                    </p>
                </div>

                {/* List Barang dengan Input Jumlah Realisasi */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                        Jumlah Realisasi Barang :
                    </label>

                    {adminListBarang.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs">
                            Memuat daftar barang...
                        </div>
                    ) : (
                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
                            {adminListBarang.map((item: any, index: number) => {
                                const bObj = item.barang || item.suku_cadang || item.atk;
                                return (
                                    <div key={index} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-lg">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {bObj ? bObj.name : `Barang (ID: ${item.barang_id || item.suku_cadang_id || item.atk_id})`}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                                                <span className="badge badge-sm badge-outline text-slate-600">
                                                    Minta: <strong className="text-slate-800 ml-1">{item.jumlahpermintaan || 1}</strong>
                                                </span>
                                                <span className="badge badge-sm badge-outline text-blue-700 border-blue-300">
                                                    Stok Gudang: <strong className="ml-1">{bObj?.stock ?? "-"}</strong>
                                                </span>
                                                {bObj?.expired && (
                                                    <span className="badge badge-sm badge-outline text-amber-700 border-amber-300">
                                                        Exp: {dayjs(bObj.expired).format("DD MMM YYYY")}
                                                    </span>
                                                )}
                                                <span className="badge badge-sm badge-outline text-slate-600">
                                                    Satuan: {bObj?.satuan || "-"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Input Realisasi per item */}
                                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                            <label htmlFor={`realisasi-${index}`} className="text-xs font-bold text-slate-700">
                                                Realisasi:
                                            </label>
                                            <input
                                                type="number"
                                                id={`realisasi-${index}`}
                                                min={1}
                                                max={bObj?.stock || 9999}
                                                value={jumlahRealisasi[index] ?? (item.jumlahpermintaan ?? 1)}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setJumlahRealisasi((prev) => {
                                                        const updated = [...prev];
                                                        updated[index] = val;
                                                        return updated;
                                                    });
                                                }}
                                                className="input input-sm input-bordered w-20 text-center font-bold text-slate-900 rounded-lg bg-white"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Modal Admin */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setModalAdminOpen(false)}
                        disabled={isSubmittingAdmin}
                        className="btn btn-sm btn-ghost text-slate-600"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmitAdminVerif}
                        disabled={isSubmittingAdmin}
                        className="btn btn-sm btn-primary text-white font-semibold gap-1.5"
                    >
                        {isSubmittingAdmin ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-base">check_circle</span>
                                <span>Verifikasi & Serahkan</span>
                            </>
                        )}
                    </button>
                </div>
            </ModalGeneral>
        </section>
    );
}
