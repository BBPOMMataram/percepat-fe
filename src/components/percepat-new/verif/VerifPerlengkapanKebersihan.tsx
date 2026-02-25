"use client";
import { ModalGeneral } from "@/components/main/ModalGeneral";
import { showAlert } from "@/features/alertSlice";
import { RootState } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function VerifPerlengkapanKebersihanPercepat() {
    const [dataPermintaan, setDataBarang] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [kodeBarangOrNameFilter, setKodeBarangOrNameFilter] = useState("");
    const [listBarangPermintaan, setListBarangPermintaan] = useState<any>([]);
    const [showModalListBarangPermintaan, setShowModalListBarangPermintaan] = useState(false);

    const { user } = useSelector((state: RootState) => state.auth);

    const dispatch = useDispatch();

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;

    const getData = useCallback(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/verif-perlengkapan-kebersihan?
            per_page=${perPage}
            &kode_or_name=${kodeBarangOrNameFilter}
            &katim_id=${user?.id}
            &is_kabagtu=${user?.employee?.group_jabatan_id === 2 ? 1 : 0}` // 2 = Kabag TU
        )
            .then(({ data }) => {
                setDataBarang(data)
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
                console.log(data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [perPage, kodeBarangOrNameFilter, user?.id, user?.employee?.group_jabatan_id]);

    useEffect(() => {
        getData()
    }, [getData]);

    const showListBarangHandler = (id: number) => {
        setShowModalListBarangPermintaan(true);
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/list-permintaan-perlengkapan-kebersihan/${id}`)
            .then(({ data }) => {
                // dispatch(permintaanActions.setListInventory(data.data));
                console.log('list barang', data);
                setListBarangPermintaan(data.data)
            })
            .catch((err) => {
                console.log(err)
            });
    }

    const verifHandler = (id: number) => {
        // Tampilkan konfirmasi native browser; lanjutkan hanya jika user menekan "OK"
        if (!window.confirm("Apakah Anda yakin ingin memverifikasi permintaan ini?")) {
            return;
        }

        api.post(`/api/v1/verif-katim-perlengkapan-kebersihan/${id}`)
            .then(res => {
                console.log(res);
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                getData();
            })
            .catch(err => {
                console.log(err)
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message || err.message, description: err.response?.data?.message || "No Message from Backend" }));
            })
    }

    const verifKabagTuHandler = (id: number) => {
        // Tampilkan konfirmasi native browser; lanjutkan hanya jika user menekan "OK"
        if (!window.confirm("Apakah Anda yakin ingin memverifikasi permintaan ini?")) {
            return;
        }

        api.post(`/api/v1/verif-kabagtu-perlengkapan-kebersihan/${id}`,
            {
                user
            })
            .then(res => {
                console.log(res);
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                getData();
            })
            .catch(err => {
                console.log(err)
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message || err.message, description: err.response?.data?.message || "No Message from Backend" }));
            })
    }

    return (
        <>
            <h2 className="mb-5 font-bold text-lg lg:text-3xl font-serif">Data Permintaan Perlengkapan Kebersihan</h2>
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
                                    <td className="px-4 py-3 capitalize">{item.peminta.name}</td>
                                    <td className="px-4 py-3 capitalize">{item.bidang?.name || item.bidang_name_auth_external}</td>
                                    <td className="px-4 py-3 capitalize">{item.bidang?.user?.name || item.katim?.name}</td>
                                    <td className="px-4 py-3 capitalize">{item.status?.name}</td>
                                    <td className="px-4 py-3 capitalize">{dayjs(item.tgl_permintaan).format("DD MMM YYYY")}</td>
                                    <td className="px-4 py-3">{
                                        item.tgl_penyerahan ?
                                            dayjs(item.tgl_penyerahan).format("DD MMM YYYY")
                                            : '-'
                                    }</td>
                                    <td className="px-4 py-3 flex gap-1">
                                        <span className="btn btn-sm btn-accent tooltip tooltip-accent tooltip-left" data-tip="List Barang" onClick={() => showListBarangHandler(item.id)}>
                                            <span className="material-symbols-outlined">
                                                list
                                            </span>
                                        </span>
                                        {
                                            (user?.id === item.katim?.external_user_id && item.status_id === 1) &&
                                            <span className="btn btn-sm btn-success tooltip tooltip-success tooltip-left" data-tip="Verif Permintaan" onClick={() => verifHandler(item.id)}>
                                                <span className="material-symbols-outlined">
                                                    check_small
                                                </span>
                                            </span>
                                        }
                                        {
                                            (item.status_id === 2) &&
                                            <span className="btn btn-sm  btn-error tooltip tooltip-error tooltip-left" data-tip="Verif Permintaan KabagTU" onClick={() => verifKabagTuHandler(item.id)}>
                                                <span className="material-symbols-outlined">
                                                    check_small
                                                </span>
                                            </span>
                                        }
                                    </td>
                                </tr>
                            )
                            )
                        )}
                    </tbody>
                </table>

                {/* Per page selector and links */}
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
                                                    console.log('test', data);

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
                    className="btn btn-primary btn-floating btn-circle hover:scale-110 hover:rotate-[90deg] transition-all duration-200 ease-in-out" >
                    <span className="material-symbols-outlined">
                        add
                    </span>
                </Link>
            </div>
            {
                showModalListBarangPermintaan &&
                <ModalGeneral
                    open={showModalListBarangPermintaan}
                    onClose={() => setShowModalListBarangPermintaan(false)}
                >
                    <h3 className="text-lg font-semibold mb-4">List Barang Permintaan</h3>

                    <ul className="max-h-96 overflow-y-auto list-decimal list-inside">
                        {listBarangPermintaan.length === 0 ? (
                            <li className="text-gray-500">Tidak ada barang dalam permintaan ini.</li>
                        ) : (
                            listBarangPermintaan.map((item: any, index: number) => (
                                <li key={index} className="my-1 py-1 px-2 w-fit rounded">
                                    {`${item.barang?.name} (Stok: ${item.barang?.stock})`}
                                    {/* {
                                        !isViewMode && <span data-id={item.id} className="text-red-600 ml-1" onClick={removeItemListHandler} role="button">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </span>
                                    } */}
                                    <div className="text-xs [&>span]:mr-1">
                                        <span className="badge badge-soft badge-primary">Jumlah Permintaan : {item.jumlahpermintaan}</span>
                                        <span className="badge badge-soft badge-primary">Jumlah Realisasi : {item.jumlahrealisasi || '-'}</span>
                                        <span className="badge badge-soft badge-primary">Satuan : {item.barang.satuan || '-'}</span>
                                        {/* <span className="badge badge-soft badge-primary">Expired : {expiredFormatted}</span> */}
                                        <span className="badge badge-soft badge-primary">Ket : {item.keterangan || '-'}</span>
                                    </div>
                                    {/* 
                                    {
                                        showRealisasiInput &&
                                        <div>
                                            <label htmlFor="realisasi">Realisasi : </label>
                                            <input type="number" name="realisasi" min={0}
                                                className="realisasi mt-2 rounded w-16 px-2 py-1"
                                                onChange={(e: any) => setJumlahRealisasi((prev: any) => {
                                                    const updatedArray = [...prev];
                                                    updatedArray[index] = parseInt(e.target.value) || 0; // Use parseInt to convert to number
                                                    return updatedArray;
                                                })}
                                            />
                                        </div>
                                    } */}
                                </li>
                            ))
                        )}
                    </ul>
                </ModalGeneral>
            }
        </>
    )
}