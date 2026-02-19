"use client"
import api from "@/utils/api"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import AdminFormPengajuanSiapMelayani from "./AdminFormPengajuanSiapMelayani"

export default function AdminPengajuanSiapMelayani() {
    const [pengajuan, setPengajuan] = useState<any>([])
    const [mergedPengajuanWithUser, setMergedPengajuanWithUser] = useState<any>({})
    //for modal
    const [pengajuanItem, setPengajuanItem] = useState<any>(null)
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState("")
    const [mode, setMode] = useState("")

    const loadData = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan`)
            .then(res => {
                setPengajuan(res.data)
            })
    }

    useEffect(() => {
        console.log(mergedPengajuanWithUser);
    }, [mergedPengajuanWithUser]);

    useEffect(() => {
        if (!Array.isArray(pengajuan?.data)) return;

        const items = pengajuan?.data;

        // 1. Kumpulkan external_user_id dari setiap disposisi
        const ids = items
            .map((d: any) => d.user?.external_user_id)
            .filter((v: any, i: number, arr: any) => v && arr.indexOf(v) === i);

        if (ids.length === 0) {
            setMergedPengajuanWithUser(pengajuan);
            return;
        }

        // 2. Fetch batch user
        api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`, { ids })
            .then(res => {
                const authUsers = res.data;

                const authMap: Record<string, any> = {};
                authUsers.forEach((u: any) => authMap[u.id] = u);

                // 3. Merge ke setiap disposisi
                const merged = items.map((item: any) => ({
                    ...item,
                    user: item.user
                        ? {
                            ...item.user,
                            auth_user: authMap[item.user.external_user_id] || null
                        }
                        : null
                }));


                setMergedPengajuanWithUser({ ...pengajuan, data: merged });
            })
            .catch(err => {
                console.log(err);
                setMergedPengajuanWithUser(pengajuan);
            });

    }, [pengajuan]);

    const handleAccept = (item: any) => {
        setMode("Accept")
        setOpen(true)
        setUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-accept/${item.id}`)
        setPengajuanItem(item)
    }

    const handleReject = (item: any) => {
        setMode("Reject")
        setOpen(true)
        setUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-deny/${item.id}`)
        setPengajuanItem(item)
    }

    const handleCancel = (item: any) => {
        setMode("Cancel")
        setOpen(true)
        setUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/pengajuan-return/${item.id}`)
        setPengajuanItem(item)
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <>
            <AdminFormPengajuanSiapMelayani open={open} onClose={() => setOpen(false)} onSuccess={loadData} url={url} pengajuan={pengajuanItem} mode={mode} />

            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Pengajuan PKL</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Siap Melayani</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="w-full overflow-x-auto">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>University</th>
                                <th>Mayor</th>
                                <th>NIM</th>
                                <th>Position</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Surat Pengajuan</th>
                                <th>Proposal</th>
                                <th>Status</th>
                                <th>Note</th>
                                <th>#</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                mergedPengajuanWithUser?.data?.map((item: any, index: number) => (
                                    <tr key={item.id} className="">
                                        <td>{(mergedPengajuanWithUser?.current_page - 1) * parseInt(mergedPengajuanWithUser?.per_page) + index + 1}</td>
                                        <td>{item.user?.auth_user?.name}</td>
                                        <td>{item.user?.auth_user?.email}</td>
                                        <td>{item.user?.auth_user?.phones.map((phone: any) => phone.phone_number)}</td>
                                        <td>{item.user?.auth_user?.student?.university}</td>
                                        <td>{item.user?.auth_user?.student?.jurusan}</td>
                                        <td>{item.user?.auth_user?.student?.nim}</td>
                                        <td>{item.position?.name}</td>
                                        <td>{item.period_start ? dayjs(item.created_at).format("dddd, DD MMMM YYYY (HH:mm)") : '-'}</td>
                                        <td>{item.period_end ? dayjs(item.created_at).format("dddd, DD MMMM YYYY (HH:mm)") : '-'}</td>
                                        <td className="text-center">
                                            {item.surat_pengajuan ?
                                                <button onClick={() => {
                                                    const frontendUrl = `/api/proxy/pdf?path=${encodeURIComponent(item.surat_pengajuan)}`;
                                                    window.open(frontendUrl, "_blank");
                                                }} className="cursor-pointer">
                                                    <span className="material-symbols-outlined text-bpom-green">
                                                        eye_tracking
                                                    </span>
                                                </button>
                                                : '-'}
                                        </td>
                                        <td className="text-center">
                                            {item.proposal ?
                                                <button onClick={() => {
                                                    const frontendUrl = `/api/proxy/pdf?path=${encodeURIComponent(item.proposal)}`;
                                                    window.open(frontendUrl, "_blank");
                                                }} className="cursor-pointer">
                                                    <span className="material-symbols-outlined text-bpom-green">
                                                        eye_tracking
                                                    </span>
                                                </button>
                                                : '-'}
                                        </td>
                                        <td>{item.status}</td>
                                        <td>{item.catatan}</td>
                                        <td>
                                            {
                                                item.status === 'diproses' ?
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleAccept(item)}
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-error"
                                                            onClick={() => handleReject(item)}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                    :
                                                    <button
                                                        className="btn btn-sm btn-error"
                                                        onClick={() => handleCancel(item)}
                                                    >
                                                        Cancel
                                                    </button>
                                            }
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                {/* links */}
                <div className="flex justify-end mt-8">
                    <div className="btn-group">
                        {
                            pengajuan?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            api.get(link.url)
                                                .then(res => {
                                                    setPengajuan(res.data)
                                                })
                                        }
                                    }}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                                </button>
                            )
                        }
                    </div>
                </div>
            </div>
        </>
    )
}