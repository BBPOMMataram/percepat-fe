import api from "@/utils/api";
import dayjs from "dayjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import GroupJabatan from "./GroupJabatan";

export default function ListDisposisiPemeliharaan({ listDisposisi }: any) {
    const [mergedDisposisi, setMergedDisposisi] = useState<any[]>([]);

    useEffect(() => {
        if (!Array.isArray(listDisposisi)) return;

        // 1. Kumpulkan semua external_user_id dari from_user + to_user
        const ids = [
            ...listDisposisi.map(d => d.from_user?.external_user_id),
            ...listDisposisi.map(d => d.to_user?.external_user_id),
        ]
            .filter(Boolean) // hilangkan null/undefined
            .filter((v, i, arr) => arr.indexOf(v) === i); // unique

        if (ids.length === 0) {
            setMergedDisposisi(listDisposisi);
            return;
        }

        // 2. Fetch batch user ke bpom_auth
        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authUsers = res.data; // array user auth

                // ubah ke bentuk map biar lookup cepat
                const authMap: Record<string, any> = {};
                authUsers.forEach((u: any) => {
                    authMap[u.id] = u;
                });

                // 3. Merge auth_user ke from_user & to_user
                const merged = listDisposisi.map((item: any) => {
                    return {
                        ...item,
                        from_user: {
                            ...item.from_user,
                            auth_user: authMap[item.from_user?.external_user_id] || null,
                        },
                        to_user: {
                            ...item.to_user,
                            auth_user: authMap[item.to_user?.external_user_id] || null,
                        },
                    };
                });

                setMergedDisposisi(merged);
            })
            .catch(err => {
                console.log(err);
                setMergedDisposisi(listDisposisi); // fallback ke data asli kalau error
            })
    }, [listDisposisi]);

    return (
        <div className="mb-6">
            <h2 className="mb-4 font-semibold text-lg font-serif">Riwayat Disposisi</h2>
            <div>
                <ul className="list bg-base-100 rounded-box shadow-md">

                    {mergedDisposisi.map((disposisi, i) => (
                        < li className="list-row" key={i} >
                            <div><Image alt="profile photo" width={40} height={40} className="size-10 rounded-full" src={disposisi?.from_user?.auth_user?.photo_path} /></div>
                            < div >
                                <div>{disposisi?.from_user?.auth_user?.name}</div>
                                <GroupJabatan disposisi={disposisi} />
                            </div>
                            <p className="list-col-wrap text-xs">
                                {disposisi?.note || 'Tidak ada catatan'}
                            </p>
                            <div className="text-xs opacity-60">
                                {dayjs(disposisi?.created_at).format('DD MMM YYYY - HH:mm')}
                            </div>
                        </li>
                    ))
                    }
                    {mergedDisposisi.at(-1)?.to_user?.auth_user ? (
                        <div className="p-4 text-error animate-pulse">Menunggu response dari {mergedDisposisi.at(-1)?.to_user?.auth_user?.name}</div>
                    ) : null}
                </ul >
            </div >
        </div >
    )
}