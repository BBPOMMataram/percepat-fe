"use client";
import { ModalGeneral } from "@/components/main/ModalGeneral";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import api from "@/utils/api";
import dayjs from "dayjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function PermintaanAtkPercepat() {
    const { user } = useRequireAuth();
    const [dataPermintaan, setDataBarang] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [kodeBarangOrNameFilter, setKodeBarangOrNameFilter] = useState("");
    const [listBarangPermintaan, setListBarangPermintaan] = useState<any>([]);
    const [showModalListBarangPermintaan, setShowModalListBarangPermintaan] = useState(false);

    // === STATE BARU UNTUK DELETE ===
    const [showModalConfirmDelete, setShowModalConfirmDelete] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;

    const fetchData = (url?: string) => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-atk?
            per_page=${perPage}
            &kode_or_name=${kodeBarangOrNameFilter}
            `)
            .then(({ data }) => {
                setDataBarang(data)
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
                console.log(data);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    useEffect(() => {
        fetchData();
    }, [perPage, kodeBarangOrNameFilter]);

    const showListBarangHandler = (id: number) => {
        setShowModalListBarangPermintaan(true);
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/list-permintaan-atk/${id}`)
            .then(({ data }) => {
                console.log('list barang', data);
                setListBarangPermintaan(data.data)
            })
            .catch((err) => {
                console.log(err)
            });
    }

    const downloadSpbHandler = (id: number) => {
        api({
            url: `/api/v1/download-permintaan-atk/${id}`,
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `SPB-ATK-${id}.pdf`); //or any other extension
                document.body.appendChild(link);
                link.click();

                toast.success('Download berhasil !', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
            })
            .catch(err => console.log(err))
    }

    const openConfirmDeleteHandler = (id: number) => {
        setSelectedDeleteId(id);
        setShowModalConfirmDelete(true);
    };

    const closeConfirmDeleteHandler = () => {
        setSelectedDeleteId(null);
        setShowModalConfirmDelete(false);
    };

    const confirmDeleteHandler = () => {
        if (!selectedDeleteId) return;

        setIsDeleting(true);
        api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-atk/${selectedDeleteId}`)
            .then(() => {
                toast.success('Data berhasil dihapus!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                });
                closeConfirmDeleteHandler();
                fetchData(); // refresh data setelah delete
            })
            .catch((err) => {
                console.log(err);
                toast.error('Gagal menghapus data!', {
                    position: "top-right",
                    autoClose: 3000,
                    theme: "light",
                });
            })
            .finally(() => setIsDeleting(false));
    };

    const closeModalListBarangPermintaanHandler = () => {
        setShowModalListBarangPermintaan(false);
        setListBarangPermintaan([]);
    }

    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Permintaan ATK</h2>
            <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Tampilkan</span>
                    <select
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                        className="select select-bordered w-fit"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </div>
                {/* <div className="ml-auto flex items-center gap-2">
                    <input type="text" className="ar-input-text-purple" placeholder="Cari Kode Barang / Nama" onChange={e => filterKodeOrNameHander(e.currentTarget.value)} />
                </div> */}
            </div>
            <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
                <table className="table table-zebra">
                    <thead className="bg-primary text-primary-content uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Pemohon</th>
                            <th className="px-4 py-3 text-left">Fungsi</th>
                            <th className="px-4 py-3 text-left">KaTim / Penyelia</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Tgl Permintaan</th>
                            <th className="px-4 py-3 text-left">Tgl Penyerahan</th>
                            <th className="px-4 py-3 text-left">Yang Menyerahkan</th>
                            <th className="px-4 py-3 text-center">##</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataPermintaan?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-6 text-gray-500">
                                    Belum ada data permintaan
                                </td>
                            </tr>
                        ) : (
                            dataPermintaan?.data?.map((item: any, index: number) => (
                                <tr
                                    key={item.id}
                                    className={`border-t transition`}
                                >
                                    <td className="px-4 py-3 font-medium">{rowNumber(index)}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.peminta.name}</td>
                                    <td className="px-4 py-3 font-semibold capitalize">{item.bidang?.name || item.bidang_name_auth_external}</td>
                                    <td className={`px-4 py-3`}>{item.bidang?.user?.name || item.katim?.name}</td>
                                    <td className={`px-4 py-3`}>{item.status?.name}</td>
                                    <td className={`px-4 py-3`}>{dayjs(item.tgl_permintaan).format("DD MMM YYYY")}</td>
                                    <td className={`px-4 py-3`}>{
                                        item.tgl_penyerahan ?
                                            dayjs(item.tgl_penyerahan).format("DD MMM YYYY")
                                            : '-'
                                    }</td>
                                    <td className={`px-4 py-3`}>{item.penyerah?.name || '-'}</td>
                                    <td className="px-1 py-3 flex">
                                        <span className="btn btn-xs btn-ghost btn-error tooltip tooltip-error tooltip-left" data-tip="Download SPB" onClick={() => downloadSpbHandler(item.id)}>
                                            <span className="material-symbols-outlined text-[20px]!">
                                                download
                                            </span>
                                        </span>

                                        <span className="btn btn-xs btn-ghost btn-accent tooltip tooltip-accent tooltip-left" data-tip="List Barang" onClick={() => showListBarangHandler(item.id)}>
                                            <span className="material-symbols-outlined text-[20px]!">
                                                list
                                            </span>
                                        </span>

                                        {(item.status?.id === 1 && item.peminta?.external_user_id === user?.id) && (
                                            <span
                                                className="btn btn-xs btn-ghost text-error tooltip tooltip-error tooltip-left"
                                                data-tip="Hapus"
                                                onClick={() => openConfirmDeleteHandler(item.id)}
                                            >
                                                <span className="material-symbols-outlined text-[20px]!">delete</span>
                                            </span>
                                        )}

                                        {(item.status?.id < 4 && item.peminta?.external_user_id === user?.id) && (
                                            <Link
                                                href={`/percepat-new/permintaan/form?id=${item.id}&type=atk`}
                                                className="btn btn-xs btn-ghost btn-warning tooltip tooltip-warning tooltip-left"
                                                data-tip="Edit"
                                            >
                                                <span className="material-symbols-outlined text-[20px]!">edit</span>
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Per page selector and links */}
                <div className="flex justify-between items-center m-6">
                    <span>
                        Menampilkan {dataPermintaan?.from} - {dataPermintaan?.to} dari {dataPermintaan?.total} data
                    </span>

                </div>
                <div className="flex justify-end items-center m-4 gap-4">

                    <div className="btn-group">
                        {
                            dataPermintaan?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            // Preserve per_page, status, and petugas parameters when navigating
                                            const url = new URL(link.url, window.location.origin);
                                            url.searchParams.set('per_page', String(perPage));
                                            // if (statusFilter !== "all") {
                                            //     url.searchParams.set('status', statusFilter);
                                            // }
                                            // if (petugasFilter !== "all") {
                                            //     url.searchParams.set('petugas_id', petugasFilter);
                                            // }
                                            // setIsloading(true);
                                            api.get(url.toString())
                                                .then(({ data }) => {
                                                    // setIsloading(false);
                                                    setDataBarang(data);
                                                    setCurrentPage(data?.current_page);
                                                    setPerPage(data?.per_page);
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
            <div className="fixed bottom-4 lg:bottom-8 right-4 lg:right-8 tooltip tooltip-left" data-tip="Create New">
                <Link
                    href="/percepat-new/permintaan/form"
                    className="btn btn-primary btn-floating btn-circle hover:scale-110 hover:rotate-90 transition-all duration-200 ease-in-out" >
                    <span className="material-symbols-outlined">
                        add
                    </span>
                </Link>
            </div>

            {
                showModalListBarangPermintaan &&
                <ModalGeneral
                    open={showModalListBarangPermintaan}
                    onClose={closeModalListBarangPermintaanHandler}
                >
                    <h3 className="text-lg font-semibold mb-4">List Barang Permintaan</h3>

                    <ul className="max-h-96 overflow-y-auto list-decimal list-inside">
                        {listBarangPermintaan.length === 0 ? (
                            <li className="text-gray-500">Tidak ada barang dalam permintaan ini.</li>
                        ) : (
                            listBarangPermintaan.map((item: any, index: number) => (
                                <li key={index} className="my-1 py-1 px-2 w-fit rounded">
                                    {`${item.atk?.name} (Stok: ${item.atk?.stock})`}
                                    <div className="text-xs [&>span]:mr-1">
                                        <span className="badge badge-soft badge-primary">Jumlah Permintaan : {item.jumlahpermintaan}</span>
                                        <span className="badge badge-soft badge-primary">Jumlah Realisasi : {item.jumlahrealisasi || '-'}</span>
                                        <span className="badge badge-soft badge-primary">Satuan : {item.atk?.satuan || '-'}</span>
                                        <span className="badge badge-soft badge-primary">Ket : {item.keterangan || '-'}</span>
                                    </div>

                                </li>
                            ))
                        )}
                    </ul>
                </ModalGeneral>
            }

            {/* === MODAL KONFIRMASI DELETE === */}
            {showModalConfirmDelete && (
                <ModalGeneral open={showModalConfirmDelete} onClose={closeConfirmDeleteHandler}>
                    <div className="text-center">
                        <span className="material-symbols-outlined text-error text-5xl mb-3">warning</span>
                        <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
                        <p className="text-gray-500 mb-6">
                            Apakah Anda yakin ingin menghapus data permintaan ini? <br />
                            <span className="text-error font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                className="btn btn-ghost"
                                onClick={closeConfirmDeleteHandler}
                                disabled={isDeleting}
                            >
                                Batal
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={confirmDeleteHandler}
                                disabled={isDeleting}
                            >
                                {isDeleting
                                    ? <><span className="loading loading-spinner loading-sm"></span> Menghapus...</>
                                    : 'Ya, Hapus'
                                }
                            </button>
                        </div>
                    </div>
                </ModalGeneral>
            )}
        </>
    )
}