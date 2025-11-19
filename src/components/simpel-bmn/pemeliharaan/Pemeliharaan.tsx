"use client"

import api from "@/utils/api"
import Link from "next/link"
import { useEffect, useState } from "react"
import ContentDisposisi from "./ContentDisposisi"
import ContentPemeliharaan from "./ContentPemeliharaan"
import ModalDetailPemeliharaan from "./detail/ModalDetailPemeliharaan"

export default function PemeliharaanSimpelBmn() {
    const [data, setData] = useState<any[]>([])
    const [showModalDetailPemeliharaan, setShowModalDetailPemeliharaan] = useState(false);
    const [code, setCode] = useState<string>("");
    const [listDisposisi, setListDisposisi] = useState<any[]>([]);
    const [mergedDisposisi, setMergedDisposisi] = useState<any[]>([]);

    const getData = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-by-user`)
            .then(res => {
                setData(res?.data)
            })
            .catch(err => {
                console.error(err)
            })
    }

    const getDataDisposisi = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-disposition-by-user`)
            .then(res => {
                setListDisposisi(res?.data)
            })
            .catch(err => {
                console.error(err)
            })
    }

    useEffect(() => {
        getData()
        getDataDisposisi()
    }, [])

    useEffect(() => {
        if (!Array.isArray(listDisposisi)) return;

        // 1. Kumpulkan semua external_user_id (disposisi + pelapor)
        const ids = listDisposisi.flatMap(item => {
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
            setMergedDisposisi(listDisposisi);
            return;
        }

        // 2. Fetch batch user
        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authUsers = res.data;

                const authMap: Record<string, any> = {};
                authUsers.forEach((u: any) => authMap[u.id] = u);

                // 3. Merge disposisi + pelapor
                const merged = listDisposisi.map(item => ({
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
            })
            .catch(err => {
                console.log(err);
                setMergedDisposisi(listDisposisi);
            });

    }, [listDisposisi]);

    const handleOpenDetail = (code: string) => {
        setCode(code);
        setShowModalDetailPemeliharaan(true);
    }

    return (
        <div>
            {/* name of each tab group should be unique */}
            <div className="tabs tabs-lift">
                <label className="tab">
                    <input type="radio" name="my_tabs_4" />
                    <span className="material-symbols-outlined">
                        assignment
                    </span>
                    Pemeliharaan Anda
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    <ContentPemeliharaan data={data} handleOpenDetail={handleOpenDetail} />
                </div>

                <label className="tab">
                    <input type="radio" name="my_tabs_4" defaultChecked />
                    <span className="material-symbols-outlined">
                        assignment_turned_in
                    </span>
                    Disposisi
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-6">
                    <ContentDisposisi disposisi={mergedDisposisi} handleOpenDetail={handleOpenDetail} />
                </div>
            </div>

            <div className="fixed bottom-4 lg:bottom-8 right-4 lg:right-8 tooltip tooltip-left" data-tip="Create New">
                <Link
                    href="/simpel-bmn/pemeliharaan/form"
                    className="btn btn-primary btn-floating btn-circle hover:scale-110 hover:rotate-[90deg] transition-all duration-200 ease-in-out" >
                    <span className="material-symbols-outlined">
                        add
                    </span>
                </Link>
            </div>

            <ModalDetailPemeliharaan
                show={showModalDetailPemeliharaan}
                onClose={() => setShowModalDetailPemeliharaan(false)}
                code={code}
            />
        </div>
    )
}