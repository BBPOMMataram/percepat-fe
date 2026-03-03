import { ModalGeneral } from "@/components/main/ModalGeneral";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function AdminPermintaanReagenPercepat() {
    const [data, setData] = useState<any>([])
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [openModalVerifPetugas, setOpenModalVerifPetugas] = useState<boolean>(false)
    const [showModalListBarangPermintaan, setShowModalListBarangPermintaan] = useState(false);
    const [listBarangPermintaan, setListBarangPermintaan] = useState<any>([]);
    const [permintaanId, setPermintaanId] = useState<number | null>(null); // 
    const [jumlahRealisasi, setJumlahRealisasi] = useState<any>([]); // Array untuk menyimpan jumlah realisasi per item

    const { user } = useSelector((state: any) => state.auth);

    const dispatch = useDispatch<AppDispatch>()

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;

    const loadData = useCallback(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/permintaan-reagen?per_page=${perPage}`)
            .then(({ data }) => {
                setData(data)
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
                console.log(data);
            })
            .catch(err => console.log(err));
    }, [perPage]);

    const getListBarangPermintaan = (id: number) => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/list-permintaan-reagen/${id}`)
            .then(({ data }) => {
                setListBarangPermintaan(data.data)
                // initialize jumlahRealisasi to match jumlah permintaan (use existing jumlahrealisasi if provided, otherwise use jumlahpermintaan, fallback to 1)
                const defaults = data.data.map((item: any) => (item.jumlahrealisasi ?? item.jumlahpermintaan ?? 1));
                setJumlahRealisasi(defaults);
            })
            .catch((err) => {
                console.log(err)
            });
    }

    const downloadSpbHandler = (id: number) => {
        api({
            url: `/api/v1/download-reagen/${id}`,
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `SPB-Reagen-${id}.pdf`); //or any other extension
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
        getListBarangPermintaan(id);
    }

    useEffect(() => {
        loadData()
    }, [perPage, loadData])

    const closeModalListBarangPermintaanHandler = () => {
        setShowModalListBarangPermintaan(false);
        setListBarangPermintaan([]);
    }

    const closeModalVerifPetugasHandler = () => {
        setOpenModalVerifPetugas(false);
        setListBarangPermintaan([]);
        setJumlahRealisasi([]);
    }

    const openModalVerifPetugasHandler = (id: number) => {
        setPermintaanId(id);
        setOpenModalVerifPetugas(true);
        getListBarangPermintaan(id);
    }

    const verifPetugasHandler = (id: number) => {
        // Tampilkan konfirmasi native browser; lanjutkan hanya jika user menekan "OK"
        if (!window.confirm("Apakah Anda yakin ingin memverifikasi permintaan ini?")) {
            return;
        }

        api.post(`/api/v1/verif-petugas-reagen/${id}`,
            {
                user,
                realisasi: jumlahRealisasi,
            })
            .then(res => {
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                loadData();
                closeModalVerifPetugasHandler();
            })
            .catch(err => {
                console.log(err)
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message || err.message, description: err.response?.data?.message || "No Message from Backend" }));
            })
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Reagen</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Percepat</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
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
                                <th className="px-4 py-3 text-left">Yang Menyerahkan</th>
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
                                        <td className="px-4 py-3 capitalize">{dayjs(item.tgl_permintaan).format("DD MMM YYYY")}</td>
                                        <td className="px-4 py-3">{
                                            item.tgl_penyerahan ?
                                                dayjs(item.tgl_penyerahan).format("DD MMM YYYY")
                                                : '-'
                                        }</td>
                                        <td className="px-4 py-3 capitalize">{item.penyerah?.name || '-'}</td>
                                        <td className="px-4 py-3 flex">
                                            <span className="btn btn-sm btn-ghost btn-error tooltip tooltip-error tooltip-left" data-tip="Download SPB"
                                                onClick={() => downloadSpbHandler(item.id)}>
                                                <span className="material-symbols-outlined">
                                                    download
                                                </span>
                                            </span>
                                            <span className="btn btn-sm btn-ghost btn-accent tooltip tooltip-accent tooltip-left" data-tip="List Barang"
                                                onClick={() => showListBarangHandler(item.id)}>
                                                <span className="material-symbols-outlined">
                                                    list
                                                </span>
                                            </span>
                                            {
                                                (item.status_id === 3) &&
                                                <span className="btn btn-sm btn-ghost btn-success tooltip tooltip-success tooltip-left" data-tip="Verif Permintaan"
                                                    onClick={() => openModalVerifPetugasHandler(item.id)}>
                                                    <span className="material-symbols-outlined">
                                                        check_small
                                                    </span>
                                                </span>
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

            <ModalGeneral
                open={showModalListBarangPermintaan}
                onClose={closeModalListBarangPermintaanHandler}
            >
                <h3 className="text-lg font-semibold mb-4">List Barang Permintaan</h3>

                <ul className="max-h-96 overflow-y-auto list-decimal list-inside">
                    {
                        listBarangPermintaan.map((item: any, index: number) => (
                            <li key={index} className="my-1 py-1 px-2 w-fit rounded">
                                {`${item.barang?.name} (Stok: ${item.barang?.stock})`}
                                <div className="text-xs [&>span]:mr-1">
                                    <span className="badge badge-soft badge-primary">Jumlah Permintaan : {item.jumlahpermintaan}</span>
                                    <span className="badge badge-soft badge-primary">Jumlah Realisasi : {item.jumlahrealisasi || '-'}</span>
                                    <span className="badge badge-soft badge-primary">Satuan : {item.barang.satuan || '-'}</span>
                                    <span className="badge badge-soft badge-primary">Ket : {item.keterangan || '-'}</span>
                                </div>
                            </li>
                        ))
                    }
                </ul>
            </ModalGeneral>

            {/* MODAL VERIF OLEH PETUGAS */}
            <ModalGeneral
                open={openModalVerifPetugas}
                onClose={closeModalVerifPetugasHandler}
            >
                <h3 className="text-lg font-semibold mb-4">Verifikasi Permintaan</h3>

                <ul className="max-h-96 overflow-y-auto list-decimal list-inside">
                    {listBarangPermintaan.length === 0 ? (
                        <li className="text-gray-500">Tidak ada barang dalam permintaan ini.</li>
                    ) : (
                        listBarangPermintaan.map((item: any, index: number) => (
                            <li key={index} className="my-1 py-1 px-2 w-fit rounded">
                                {`${item.barang?.name} (Stok: ${item.barang?.stock})`}
                                <span className="ml-4">
                                    <label htmlFor={`realisasi-${index}`} className="text-secondary">Realisasi : </label>
                                    <input
                                        type="number"
                                        id={`realisasi-${index}`}
                                        min={1}
                                        value={jumlahRealisasi[index] ?? (item.jumlahpermintaan ?? 1)}
                                        className="ar-input w-16 my-2 outline-1 outline-secondary rounded px-1"
                                        onChange={(e: any) => {
                                            const val = parseInt(e.target.value) || 0;
                                            setJumlahRealisasi((prev: any) => {
                                                const updatedArray = [...(prev || [])];
                                                updatedArray[index] = val;
                                                return updatedArray;
                                            });
                                        }}
                                    />
                                </span>
                                <div className="text-xs [&>span]:mr-1">
                                    <span className="badge badge-soft badge-primary">Jumlah Permintaan : {item.jumlahpermintaan}</span>
                                    <span className="badge badge-soft badge-primary">Jumlah Realisasi : {item.jumlahrealisasi || '-'}</span>
                                    <span className="badge badge-soft badge-primary">Satuan : {item.barang?.satuan || '-'}</span>
                                    <span className="badge badge-soft badge-primary">Expired : {item.barang?.expired ? dayjs(item.barang?.expired).format("DD MMM YYYY") : '-'}</span>
                                    <span className="badge badge-soft badge-primary">Ket : {item.keterangan || '-'}</span>
                                </div>

                            </li>
                        ))
                    )}
                </ul>

                <button className="btn btn-primary mt-4" onClick={() => verifPetugasHandler(permintaanId!)}>Verifikasi</button>
            </ModalGeneral>
        </>
    )
}