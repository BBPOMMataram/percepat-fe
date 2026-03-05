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
    const [dataPemeliharaanAnda, setDataPemeliharaanAnda] = useState<any[]>([])
    const [dataAll, setDataAll] = useState<any>(null)
    const [mergedDataAll, setMergedDataAll] = useState<any[]>([])
    const [showModalDetailPemeliharaan, setShowModalDetailPemeliharaan] = useState(false);
    const [code, setCode] = useState<string>("");
    const [listDisposisi, setListDisposisi] = useState<any[]>([]);
    const [mergedDisposisi, setMergedDisposisi] = useState<any>(null);
    const [jumlahDisposisi, setJumlahDisposisi] = useState(0);
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

    const fetchDispositionData = (status?: string) => {
        setIsLoading(true);
        let url = `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-disposition-by-user`;
        if (status && status !== "all") {
            url += `?status=${status}`;
        }
        api.get(url)
            .then(resDisposisi => {
                const disposisiData = resDisposisi?.data || [];
                setListDisposisi(disposisiData);

                // Merge user data
                if (!Array.isArray(disposisiData) || disposisiData.length === 0) {
                    setMergedDisposisi(disposisiData);
                    setIsLoading(false);
                    return;
                }

                // 1. Kumpulkan semua external_user_id (disposisi + pelapor)
                const ids = disposisiData.flatMap((item: any) => {
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
                    setMergedDisposisi(disposisiData);
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
                        const merged = disposisiData.map((item: any) => ({
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

                        setMergedDisposisi(merged);
                        setIsLoading(false);
                    })
                    .catch(err => {
                        console.log(err);
                        setMergedDisposisi(disposisiData);
                        setIsLoading(false);
                    });
            })
            .catch(err => {
                console.error(err)
                setIsLoading(false);
            })
    }


    useEffect(() => {
        fetchAllData()
        fetchDispositionData()
    }, [])

    // get user auth untuk pelapor
    useEffect(() => {
        if (!dataAll?.data || !Array.isArray(dataAll.data)) return;

        // ambil semua external_user_id pelapor
        const ids = [...new Set(
            dataAll.data
                .map((item: any) => item.pelapor?.external_user_id)
                .filter(Boolean)
        )];

        if (ids.length === 0) {
            setMergedDataAll(dataAll.data);
            return;
        }

        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authMap = Object.fromEntries(
                    res.data.map((u: any) => [u.id, u])
                );

                setMergedDataAll(
                    dataAll.data.map((item: any) => ({
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
            .catch(() => setMergedDataAll(dataAll.data));
    }, [dataAll]);

    // filter data hanya pelapor yg login untuk data pemeliharaan ANDA
    useEffect(() => {
        const filtered = mergedDataAll.filter(
            (item: any) => item.pelapor?.external_user_id === currentUserId
        );

        setDataPemeliharaanAnda(filtered);
    }, [mergedDataAll, currentUserId]);

    const handleOpenDetail = (code: string) => {
        setCode(code);
        setShowModalDetailPemeliharaan(true);
    }

    // HITUNG JUMLAH DISPOSISI YANG DITUJU USER YANG LOGIN
    useEffect(() => {
        if (!mergedDisposisi?.data || !Array.isArray(mergedDisposisi?.data)) return;

        const total = mergedDisposisi?.data.reduce((count: number, item: any) => {
            const last = item.disposisi_new_pemeliharaan?.at(-1);

            if (last?.to_user?.external_user_id === user?.id) {
                return count + 1;
            }
            return count;
        }, 0);

        setJumlahDisposisi(total);
    }, [mergedDisposisi, user]);



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
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    {
                        isLoading ? <LoadingWithoutText /> :
                            <ContentPemeliharaanAll dataAll={dataAll} handleOpenDetail={handleOpenDetail} setDataAll={setDataAll} isLoading={isLoading} setIsloading={setIsLoading} />
                    }
                </div>

                <label className="tab">
                    <input type="radio" name="my_tabs_4" />
                    <span className="material-symbols-outlined">
                        assignment
                    </span>
                    Pemeliharaan Anda
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    {
                        isLoading ? <LoadingWithoutText /> :
                            <ContentPemeliharaanAnda dataAll={dataAll} mergedDataAll={mergedDataAll} currentUserId={currentUserId} handleOpenDetail={handleOpenDetail} />
                    }
                </div>

                <label className="tab indicator">
                    <input type="radio" name="my_tabs_4" />
                    <span className="material-symbols-outlined">
                        assignment_turned_in
                    </span>
                    Disposisi
                    {jumlahDisposisi > 0 && <span className="indicator-item badge badge-error animate-pulse badge-xs">{jumlahDisposisi}</span>}
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    {
                        isLoading ? <LoadingWithoutText /> :
                            <ContentDisposisi dataDisposisi={mergedDisposisi} setDataDisposisi={setMergedDisposisi} handleOpenDetail={handleOpenDetail} updateDataDisposisi={fetchDispositionData} isLoading={isLoading} setIsloading={setIsLoading} />
                    }
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
                updateDataDisposisi={fetchDispositionData}
            />
        </div>
    )
}