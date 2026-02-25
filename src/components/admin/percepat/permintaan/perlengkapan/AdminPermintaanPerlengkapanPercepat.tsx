import { ModalGeneral } from "@/components/main/ModalGeneral";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

export default function AdminPermintaanPerlengkapanPercepat() {
    const [data, setData] = useState<any>([])
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [open, setOpen] = useState<boolean>(false)
    const [editData, setEditData] = useState<any>(null)

    const [listBarangPermintaan, setListBarangPermintaan] = useState<any>([]);
    const [showModalListBarangPermintaan, setShowModalListBarangPermintaan] = useState(false);

    const dispatch = useDispatch<AppDispatch>()

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;
    const loadData = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-perlengkapan-kebersihan??
            per_page=${perPage}`)
            .then(({ data }) => {
                setData(data)
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
                console.log(data);
            })
    }

    const downloadSpbHandler = (id: number) => {
        api({
            url: `/api/v1/download-permintaan-perlengkapan/${id}`,
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `SPB-Perlengkapan-Kebersihan-${id}.pdf`); //or any other extension
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

    useEffect(() => {
        loadData()
    }, [perPage])

    const closeModalListBarangPermintaanHandler = () => {
        setShowModalListBarangPermintaan(false);
        setListBarangPermintaan([]);
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Perlengkapan Kebersihan</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Percepat</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    {/* <div className="mb-4">
                        <button className="btn btn-primary"
                            onClick={() => {
                                setOpen(true)
                                setEditData(null)
                            }}
                        >Add New</button>
                    </div> */}

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
                <div className="w-full overflow-x-auto">
                    <table className="ar-table">
                        <thead>
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
                            {
                                data?.data?.map((item: any, index: number) => (
                                    <tr
                                        key={item.id}
                                        className={`border-t transition`}
                                    >
                                        <td className="px-4 py-3 font-medium">{rowNumber(index)}</td>
                                        <td className="px-4 py-3 capitalize">{item.peminta.name}</td>
                                        <td className="px-4 py-3 capitalize">{item.bidang?.name || item.bidang_name_auth_external}</td>
                                        <td className="px-4 py-3 capitalize">{item.bidang?.user?.name || item.katim?.name}</td>
                                        <td className="px-4 py-3 capitalize">{item.status?.name}</td>
                                        <td className="px-4 py-3 capitalize">{dayjs(item.created_at).format("DD MMM YYYY")}</td>
                                        <td className="px-4 py-3">{
                                            item.tgl_penyerahan ?
                                                dayjs(item.tgl_penyerahan).format("DD MMM YYYY")
                                                : '-'
                                        }</td>
                                        <td className="px-4 py-3 flex">
                                            <span className="btn btn-sm btn-ghost btn-error tooltip tooltip-error tooltip-left" data-tip="Download SPB" onClick={() => downloadSpbHandler(item.id)}>
                                                <span className="material-symbols-outlined">
                                                    download
                                                </span>
                                            </span>

                                            <span className="btn btn-sm btn-ghost btn-accent tooltip tooltip-accent tooltip-left" data-tip="List Barang" onClick={() => showListBarangHandler(item.id)}>
                                                <span className="material-symbols-outlined">
                                                    list
                                                </span>
                                            </span>
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
                            data?.links?.map((link: any, index: number) =>
                                <button
                                    key={index}
                                    className={`btn ${link.active && 'btn-active'} ${!link.url && 'btn-disabled'} mr-1`}
                                    onClick={() => {
                                        if (link.url) {
                                            api.get(link.url)
                                                .then(res => {
                                                    setData(res.data)
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