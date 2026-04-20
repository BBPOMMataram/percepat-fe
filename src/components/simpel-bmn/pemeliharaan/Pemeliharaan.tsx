"use client"

import LoadingWithoutText from "@/components/main/loading/LoadingWithoutText"
import { RootState } from "@/redux/store"
import api from "@/utils/api"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import ContentDisposisi from "./ContentDisposisi"
import ContentPemeliharaanAll from "./ContentPemeliharaanAll"
import ContentPemeliharaanAnda from "./ContentPemeliharaanAnda"
import ModalDetailPemeliharaan from "./detail/ModalDetailPemeliharaan"

export default function PemeliharaanSimpelBmn() {
    const [dataAll, setDataAll] = useState<any>(null)
    const [mergedDataAll, setMergedDataAll] = useState<any[]>([])
    const [dataAnda, setDataAnda] = useState<any>(null)
    const [mergedDataAnda, setMergedDataAnda] = useState<any[]>([])
    const [showModalDetailPemeliharaan, setShowModalDetailPemeliharaan] = useState(false);
    const [code, setCode] = useState<string>("");
    const [listDisposisi, setListDisposisi] = useState<any[]>([]);
    const [mergedDisposisi, setMergedDisposisi] = useState<any>(null);
    const [jumlahDisposisi, setJumlahDisposisi] = useState(0);
    const [statusFilterAnda, setStatusFilterAnda] = useState<string>("all"); // New state for Pemeliharaan Anda
    const [statusFilterDisposisi, setStatusFilterDisposisi] = useState<string>("all"); // New state for Disposisi
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useSelector((state: RootState) => state.auth);
    const currentUserId = user?.id

    const fetchAllData = (status?: string) => {
        setIsLoading(true);
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-all`;
        if (status && status !== "all") {
            url += `?status=${status}`;
        }
        api.get(url)
            .then(resAllData => {
                // Store the full response object (not just the data array)
                // This includes pagination info like links, current_page, per_page, etc.
                setDataAll(resAllData?.data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err)
                setIsLoading(false);
            })
    }

    const fetchAndaData = (status?: string, perPage?: string) => {
        if (!currentUserId) return;
        setIsLoading(true);
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-by-user`;
        const params = new URLSearchParams();
        if (status && status !== "all") params.append('status', status);
        if (perPage) params.append('per_page', perPage);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        api.get(url)
            .then(res => {
                setDataAnda(res.data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }

    const fetchDispositionData = (status?: string, perPage?: string) => {
        setIsLoading(true);
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-disposition-by-user`;
        const params = new URLSearchParams();
        if (status && status !== "all") params.append('status', status);
        if (perPage) params.append('per_page', perPage);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        api.get(url)
            .then(resDisposisi => {
                const responseData = resDisposisi?.data;
                // Ambil array item baik dari objek paginasi (.data) atau array langsung
                const disposisiItems = responseData?.data || responseData || [];
                // setListDisposisi(disposisiItems); // This state is not used directly for rendering, mergedDisposisi is.

                // Merge user data
                if (!Array.isArray(disposisiItems) || disposisiItems.length === 0) {
                    setMergedDisposisi(responseData);
                    setIsLoading(false);
                    return;
                }

                // 1. Kumpulkan semua external_user_id (disposisi + pelapor)
                const ids = disposisiItems.flatMap((item: any) => {
                    const fromToIds =
                        item.disposisi_new_pemeliharaan?.flatMap((d: any) => [
                            d.from_user?.external_user_id,
                            d.to_user?.external_user_id
                        ]) || [];

                    const pelaporId = item.pelapor?.external_user_id || null;

                    return [...fromToIds, pelaporId];
                })
                    .filter(Boolean)
                    .filter((v, i, arr) => arr.indexOf(v) === i); // unique

                if (ids.length === 0) {
                    setMergedDisposisi(responseData);
                    setIsLoading(false);
                    return;
                }

                // 2. Fetch batch user
                api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
                    .then(res => {
                        const authUsers = res.data;

                        const authMap: Record<string, any> = {};
                        authUsers.forEach((u: any) => authMap[u.id] = u);

                        // 3. Merge disposisi + pelapor
                        const merged = disposisiItems.map((item: any) => ({
                            ...item,

                            // Merge pelapor
                            pelapor: item.pelapor
                                ? {
                                    ...item.pelapor,
                                    auth_user: authMap[item.pelapor.external_user_id] || null
                                }
                                : null,

                            // Merge disposisi
                            disposisi_new_pemeliharaan: item.disposisi_new_pemeliharaan?.map((d: any) => ({
                                ...d,
                                from_user: {
                                    ...d.from_user,
                                    auth_user: authMap[d.from_user?.external_user_id] || null,
                                },
                                to_user: {
                                    ...d.to_user,
                                    auth_user: authMap[d.to_user?.external_user_id] || null,
                                },
                            })) || []
                        }));

                        // Kembalikan struktur data semula (objek paginasi atau array)
                        if (responseData?.data) {
                            setMergedDisposisi({
                                ...responseData,
                                data: merged
                            });
                        } else {
                            setMergedDisposisi(merged);
                        }
                        setIsLoading(false);
                    })
                    .catch(err => {
                        console.log(err);
                        setMergedDisposisi(responseData);
                        setIsLoading(false);
                    });
            })
            .catch(err => {
                console.error(err)
                setIsLoading(false);
            })
    }

    const fetchJumlahDisposisi = () => {
        // Untuk badge, kita perlu menghitung total data 'open' yang ditujukan ke user ini.
        // Karena tabel menggunakan paginasi server-side, kita melakukan fetch terpisah 
        // dengan per_page yang besar atau tanpa paginasi (jika didukung backend) untuk mendapatkan angka total.
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-disposition-by-user?status=open&per_page=100`;
        api.get(url)
            .then(res => {
                const responseData = res.data;
                const items = responseData?.data || responseData || [];

                const total = items.reduce((count: number, item: any) => {
                    const last = item.disposisi_new_pemeliharaan?.at(-1);
                    if (last?.to_user?.external_user_id === user?.id) {
                        return count + 1;
                    }
                    return count;
                }, 0);

                setJumlahDisposisi(total);
            })
            .catch(err => console.error("Gagal mengambil jumlah disposisi:", err));
    }

    const handleUpdateDataDisposisi = (status?: string, perPage?: string) => {
        fetchDispositionData(status ?? statusFilterDisposisi, perPage); // Use passed status or current state
        fetchJumlahDisposisi(); // This fetches open dispositions, so no status needed
    }

    useEffect(() => {
        fetchAllData();
        fetchDispositionData(statusFilterDisposisi); // Pass initial status filter
    }, [currentUserId])

    useEffect(() => {
        if (user?.id) {
            fetchJumlahDisposisi()
            fetchAndaData(statusFilterAnda); // Pass initial status filter
        }
    }, [user?.id])

    // get user auth untuk pelapor
    useEffect(() => {
        const items = dataAll?.data || dataAll;
        if (!Array.isArray(items)) return;

        // ambil semua external_user_id pelapor
        const ids = [...new Set(
            items
                .map((item: any) => item.pelapor?.external_user_id)
                .filter(Boolean)
        )];

        if (ids.length === 0) {
            setMergedDataAll(items);
            return;
        }

        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authMap = Object.fromEntries(
                    res.data.map((u: any) => [u.id, u])
                );

                setMergedDataAll(
                    items.map((item: any) => ({
                        ...item,
                        pelapor: item.pelapor
                            ? {
                                ...item.pelapor,
                                auth_user: authMap[item.pelapor.external_user_id] || null,
                            }
                            : null
                    }))
                );
            })
            .catch(() => setMergedDataAll(items));
    }, [dataAll]);

    // Merge user auth untuk data "Anda"
    useEffect(() => {
        const items = dataAnda?.data || dataAnda;
        if (!Array.isArray(items)) return;

        const ids = [...new Set(
            items
                .map((item: any) => item.pelapor?.external_user_id)
                .filter(Boolean)
        )];

        if (ids.length === 0) {
            setMergedDataAnda(items);
            return;
        }

        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authMap = Object.fromEntries(
                    res.data.map((u: any) => [u.id, u])
                );

                setMergedDataAnda(
                    items.map((item: any) => ({
                        ...item,
                        pelapor: item.pelapor
                            ? {
                                ...item.pelapor,
                                auth_user: authMap[item.pelapor.external_user_id] || null,
                            }
                            : null
                    }))
                );
            })
            .catch(() => setMergedDataAnda(items));
    }, [dataAnda]);

    const handleOpenDetail = (code: string) => {
        setCode(code);
        setShowModalDetailPemeliharaan(true);
    }

    return (
        <div>
            {/* name of each tab group should be unique */}
            <div className="tabs tabs-lift">
                <label className="tab">
                    <input type="radio" name="my_tabs_4" defaultChecked />
                    <span className="material-symbols-outlined">
                        assignment
                    </span>
                    Pemeliharaan
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6 relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center">
                            <LoadingWithoutText />
                        </div>
                    )}
                    <ContentPemeliharaanAll dataAll={dataAll} handleOpenDetail={handleOpenDetail} setDataAll={setDataAll} isLoading={isLoading} setIsloading={setIsLoading} />
                </div>

                <label className="tab">
                    <input type="radio" name="my_tabs_4" />
                    <span className="material-symbols-outlined">
                        assignment
                    </span>
                    Pemeliharaan Anda
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6 relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center">
                            <LoadingWithoutText />
                        </div>
                    )}
                    <ContentPemeliharaanAnda dataAnda={dataAnda} setDataAnda={setDataAnda} mergedDataAll={mergedDataAnda} currentUserId={currentUserId} handleOpenDetail={handleOpenDetail} isLoading={isLoading} setIsloading={setIsLoading} statusFilter={statusFilterAnda} setStatusFilter={setStatusFilterAnda} />
                </div>

                <label className="tab indicator">
                    <input type="radio" name="my_tabs_4" />
                    <span className="material-symbols-outlined">
                        assignment_turned_in
                    </span>
                    Disposisi
                    {jumlahDisposisi > 0 && <span className="indicator-item badge badge-error animate-pulse badge-xs">{jumlahDisposisi}</span>}
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6 relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center">
                            <LoadingWithoutText />
                        </div>
                    )}
                    <ContentDisposisi dataDisposisi={mergedDisposisi} setDataDisposisi={setMergedDisposisi} handleOpenDetail={handleOpenDetail} updateDataDisposisi={handleUpdateDataDisposisi} isLoading={isLoading} setIsloading={setIsLoading} statusFilter={statusFilterDisposisi} setStatusFilter={setStatusFilterDisposisi} />
                </div>
            </div>

            <div className="fixed bottom-4 lg:bottom-8 right-4 lg:right-8 tooltip tooltip-left" data-tip="Create New">
                <Link
                    href="/simpel-bmn/pemeliharaan/form"
                    className="btn btn-primary btn-floating btn-circle hover:scale-110 hover:rotate-90 transition-all duration-200 ease-in-out" >
                    <span className="material-symbols-outlined">
                        add
                    </span>
                </Link>
            </div>

            <ModalDetailPemeliharaan
                show={showModalDetailPemeliharaan}
                onClose={() => setShowModalDetailPemeliharaan(false)}
                code={code}
                updateDataDisposisi={handleUpdateDataDisposisi}
            />
        </div>
    )
}