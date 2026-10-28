import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import AdminMasterFormSukuCadangPercepat from "./AdminMasterFormSukuCadangPercepat";
import dayjs from "dayjs";
import { FileSpreadsheet, Trash2, UploadCloud, QrCode } from "lucide-react";
import { exportJsonToExcel } from "@/utils/excelExport";
import ImportMasterExcelModal from "../ImportMasterExcelModal";
import PemusnahanMasterModal from "../PemusnahanMasterModal";
import LabelStikerModal, { LabelStikerItem } from "@/components/percepat-new/label/LabelStikerModal";

export default function AdminMasterSukuCadangPercepat() {
    const [data, setData] = useState<any>([])
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [open, setOpen] = useState<boolean>(false)
    const [editData, setEditData] = useState<any>(null)
    const [kodeBarangOrNameFilter, setKodeBarangOrNameFilter] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
    const [pemusnahanModalOpen, setPemusnahanModalOpen] = useState<boolean>(false);
    const [labelModalOpen, setLabelModalOpen] = useState<boolean>(false);
    const [selectedLabelItem, setSelectedLabelItem] = useState<LabelStikerItem | null>(null);

    const dispatch = useDispatch<AppDispatch>()

    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-suku-cadang?per_page=99999`);
            const allItems = res.data?.data || [];
            
            if (allItems.length === 0) {
                dispatch(showAlert({ type: 'error', message: 'Data kosong', description: 'Tidak ada data suku cadang untuk diekspor' }));
                return;
            }

            exportJsonToExcel({
                data: allItems,
                fileName: `Data_Master_Suku_Cadang_${dayjs().format('YYYYMMDD_HHmmss')}`,
                sheetName: 'Suku Cadang',
                columns: [
                    { header: 'No', key: 'id', width: 6, formatter: (_v, _row, index) => index + 1 },
                    { header: 'Nama Suku Cadang', key: 'name', width: 45 },
                    { header: 'Stok', key: 'stock', width: 12, formatter: (v) => Number(v) || 0 },
                    { header: 'Satuan', key: 'satuan', width: 15, formatter: (v) => v || '-' },
                    { header: 'Keterangan', key: 'description', width: 30, formatter: (v) => v || '-' },
                ]
            });
            dispatch(showAlert({ type: 'success', message: 'Export Berhasil', description: `Berhasil mengekspor ${allItems.length} baris data suku cadang ke Excel.` }));
        } catch (error: any) {
            console.error(error);
            dispatch(showAlert({ type: 'error', message: 'Gagal Export', description: error.message || 'Terjadi kesalahan saat mengekspor data' }));
        } finally {
            setIsExporting(false);
        }
    };

    const rowNumber = (index: number) => (currentPage - 1) * perPage + index + 1;
    const loadData = useCallback(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-suku-cadang?per_page=${perPage}&name=${kodeBarangOrNameFilter}`)
            .then(({ data }) => {
                setData(data)
                setCurrentPage(data?.current_page);
                setPerPage(data?.per_page);
                console.log(data);
            })
    }, [perPage, kodeBarangOrNameFilter]);

    const handleRemove = (id: number) => {
        if (window.confirm('Confirm delete?')) {
            api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-suku-cadang/${id}`)
                .then((res) => {
                    dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message }))
                    loadData()
                })
                .catch(err => {
                    dispatch(showAlert({ type: 'error', message: err.response?.data?.message, description: err.data?.message }))
                })
        }
    }

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filterKodeOrNameHander = (v: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setKodeBarangOrNameFilter(v)
        }, 500);
    }

    useEffect(() => {
        loadData()
    }, [loadData])

    return (
        <>
            <AdminMasterFormSukuCadangPercepat open={open} onClose={() => setOpen(false)} initialData={editData} onSuccess={loadData} />

            <div className="bg-white rounded-2xl shadow px-8 py-4 mb-2 flex flex-col md:flex-row">
                <div className="text-lg font-semibold text-gray-800 uppercase">Suku Cadang</div>
                <h2 className="text-xl font-semibold text-gray-800 uppercase md:ml-auto">Admin Panel Percepat</h2>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="mb-4 flex items-center gap-2">
                        <button className="btn btn-primary"
                            onClick={() => {
                                setOpen(true)
                                setEditData(null)
                            }}
                        >Add New</button>
                        <button 
                            className="btn btn-success text-white gap-2"
                            disabled={isExporting}
                            onClick={handleExportExcel}
                        >
                            {isExporting ? <span className="loading loading-spinner loading-xs" /> : <FileSpreadsheet size={16} />}
                            Export Excel
                        </button>
                        <button
                            className="btn btn-outline btn-info gap-2"
                            onClick={() => setImportModalOpen(true)}
                        >
                            <UploadCloud size={16} />
                            Import Data (Excel & PDF)
                        </button>
                        <button
                            className="btn btn-outline btn-error gap-2"
                            onClick={() => setPemusnahanModalOpen(true)}
                            title="Pemusnahan seluruh data suku cadang"
                        >
                            <Trash2 size={16} />
                            Hapus Semua (Pemusnahan)
                        </button>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
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
                    <div className="ml-auto flex items-center gap-2">
                        <input type="text" className="ar-input-text-purple" placeholder="Cari Nama" onChange={e => filterKodeOrNameHander(e.currentTarget.value)} />
                    </div>
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama</th>
                                <th>Stock</th>
                                <th>Satuan</th>
                                <th>##</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                data?.data?.map((item: any, index: number) => (
                                    <tr key={item.id}>
                                        <td>{rowNumber(index)}</td>
                                        <td>{item.name}</td>
                                        <td>{item.stock}</td>
                                        <td>{item.satuan}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => {
                                                    setEditData(item);
                                                    setOpen(true);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-info btn-outline ml-1"
                                                onClick={() => {
                                                    setSelectedLabelItem({
                                                        id: item.id,
                                                        name: item.name,
                                                        code: 'SC-' + String(item.id).padStart(4, '0'),
                                                        satuan: item.satuan,
                                                        category: 'suku-cadang',
                                                        isFromMaster: true,
                                                    });
                                                    setLabelModalOpen(true);
                                                }}
                                                title="Cetak Label Barcode Master Gudang"
                                            >
                                                <QrCode size={14} /> Label
                                            </button>
                                            <button
                                                className="btn btn-sm btn-error ml-1"
                                                onClick={() => handleRemove(item.id)}
                                            >
                                                Delete
                                            </button>
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
                                            const url = new URL(link.url);
                                            url.searchParams.set('per_page', String(perPage));
                                            url.searchParams.set('name', kodeBarangOrNameFilter);

                                            api.get(url.toString())
                                                .then(res => {
                                                    setData(res.data)
                                                    setCurrentPage(res.data?.current_page);
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
            <ImportMasterExcelModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onSuccess={loadData}
                category="suku-cadang"
            />

            <PemusnahanMasterModal
                isOpen={pemusnahanModalOpen}
                onClose={() => setPemusnahanModalOpen(false)}
                onSuccess={loadData}
                category="suku-cadang"
                categoryLabel="Suku Cadang"
                totalItems={data?.total || data?.data?.length || 0}
            />

            <LabelStikerModal
                isOpen={labelModalOpen}
                onClose={() => setLabelModalOpen(false)}
                item={selectedLabelItem}
            />
        </>
    )
}

