"use client";

import api from "@/utils/api";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import SearchableSelect from "@/components/e-sapa/common/SearchableSelect";

dayjs.locale('id');

export default function MasterSuratTugas() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [suratTugas, setSuratTugas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState("10");
    const [searchBy, setSearchBy] = useState("nama");
    const [searchInput, setSearchInput] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [paginationData, setPaginationData] = useState<any>(null);
    const [totalData, setTotalData] = useState(0);

    const [optKegiatan, setOptKegiatan] = useState<any[]>([]);
    const [optWilayah, setOptWilayah] = useState<any[]>([]);
    const [optPetugas, setOptPetugas] = useState<any[]>([]);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isShowOpen, setIsShowOpen] = useState(false);
    const [showData, setShowData] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for delete confirmation modal
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // State for download format modal
    const [downloadModalItem, setDownloadModalItem] = useState<any | null>(null);
    const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: null as null | number,
        nomor_surat: "",
        tanggal_surat: "",
        kegiatan_id: "",
        nama_kegiatan: "",
        mak: "",
        maksud_tugas: "",
        wilayah_tugas: "",
        tanggal_dari: "",
        tanggal_sampai: "",
        list_petugas: [] as any[]
    });
    
    const [selectedPetugasId, setSelectedPetugasId] = useState("");

    const fetchOptions = async () => {
        try {
            const [kegiatanRes, wilayahRes, petugasRes] = await Promise.all([
                api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/kegiatan?limit=1000`),
                api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/wilayah?limit=1000`),
                api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/petugas?limit=1000`)
            ]);
            
            setOptKegiatan(kegiatanRes.data?.data || kegiatanRes.data || []);
            setOptWilayah(wilayahRes.data?.data || wilayahRes.data || []);
            
            const rawPetugas = (petugasRes.data?.data || petugasRes.data || []).map((p: any) => ({
                ...p,
                jabatan: p.Jabatan || p.jabatan || p.Pangkat || p.pangkat || ""
            }));

            setOptPetugas(rawPetugas);
        } catch (err) {
            console.error("Gagal mengambil data opsi:", err);
            toast.error("Gagal memuat opsi form");
        }
    };

    const fetchData = useCallback(async (url?: string) => {
        setLoading(true);
        let endpoint = url || `${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st?page=${currentPage}&value_per_page=${perPage}&name=${activeSearch}`;

        try {
            const res = await api.get(endpoint);
            const responseData = res.data;
            
            if (Array.isArray(responseData)) {
                setSuratTugas(responseData);
                setTotalData(responseData.length);
            } else if (Array.isArray(responseData?.data)) {
                setSuratTugas(responseData.data);
                setPaginationData(responseData);
                setTotalData(responseData?.meta?.total || responseData?.total || responseData.data.length);
            } else if (Array.isArray(responseData?.data?.data)) {
                setSuratTugas(responseData.data.data);
                setPaginationData(responseData.data);
                setTotalData(responseData.data?.meta?.total || responseData.data?.total || responseData.data.data.length);
            }
        } catch (err) {
            console.error("Gagal mengambil data surat tugas:", err);
            toast.error("Gagal mengambil data surat tugas");
            setSuratTugas([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, perPage, activeSearch]);

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, [fetchData]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setActiveSearch(searchInput);
    };

    const handleResetSearch = () => {
        setSearchInput("");
        setActiveSearch("");
        setCurrentPage(1);
    };

    const handleOpenAdd = () => {
        setFormData({
            id: null, nomor_surat: "", tanggal_surat: "", kegiatan_id: "", nama_kegiatan: "",
            mak: "", maksud_tugas: "", wilayah_tugas: "", tanggal_dari: "", tanggal_sampai: "", list_petugas: []
        });
        setSelectedPetugasId("");
        setIsShowOpen(false);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        const mappedPetugas = item.list_petugas?.map((lp: any) => {
            const matchedInOpt = optPetugas.find((op: any) => String(op.id) === String(lp.petugas_id));
            return {
                id: lp.petugas_id,
                nm_petugas: lp.petugas?.nm_petugas || matchedInOpt?.nm_petugas || `Petugas ID: ${lp.petugas_id}`,
                jabatan: lp.petugas?.Jabatan || lp.petugas?.jabatan || lp.petugas?.Pangkat || lp.petugas?.pangkat || matchedInOpt?.jabatan || ""
            };
        }) || [];

        setFormData({
            id: item.id,
            nomor_surat: item.nomor_surat || "",
            tanggal_surat: dayjs(item.tanggal_surat).format("YYYY-MM-DD"),
            kegiatan_id: item.id_kegiatan || "",
            nama_kegiatan: item.nama_kegiatan || "",
            mak: item.mak_kegiatan || "",
            maksud_tugas: item.maksud_tugas || "",
            wilayah_tugas: item.wilayah_tugas || "",
            tanggal_dari: dayjs(item.tanggal_dari).format("YYYY-MM-DD"),
            tanggal_sampai: dayjs(item.tanggal_sampai).format("YYYY-MM-DD"),
            list_petugas: mappedPetugas
        });
        setSelectedPetugasId("");
        setIsShowOpen(false);
        setIsFormOpen(true);
    };

    const handleOpenShow = (item: any) => {
        setShowData(item);
        setIsFormOpen(false);
        setIsShowOpen(true);
    };

    const handleDownloadFile = async (item: any, format: 'docx' | 'pdf') => {
        if (!item?.id) return;
        setDownloadingFormat(format);
        const formatLabel = format === 'docx' ? 'Word (.docx)' : 'PDF (.pdf)';
        
        try {
            const cleanNomor = (item.nomor_surat || 'surat_tugas').replace(/[\/\\:\*\?"<>\|]/g, '-');
            const fileName = `ST-${cleanNomor}.${format}`;

            const res = await api.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/download-st/${item.id}?format=${format}`,
                { responseType: 'blob' }
            );

            const mimeType = format === 'pdf' 
                ? 'application/pdf' 
                : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            const blob = new Blob([res.data], { type: mimeType });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success(`Dokumen ${formatLabel} berhasil diunduh`);
        } catch (err: any) {
            console.error(`Gagal mengunduh berkas ${format}:`, err);
            // Fallback dengan direct window.open jika blob lewat axios gagal
            try {
                window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/download-st/${item.id}?format=${format}`, "_blank");
            } catch (openErr) {
                toast.error(`Gagal mengunduh dokumen ${formatLabel}`);
            }
        } finally {
            setDownloadingFormat(null);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteConfirmId(id);
    };

    const executeDelete = async () => {
        if (!deleteConfirmId) return;
        
        try {
            const res = await api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st/${deleteConfirmId}`);
            toast.success(res.data?.msg || "Data berhasil dihapus");
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal menghapus data");
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const handleKegiatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const selectedKegiatan = optKegiatan.find((k: any) => String(k.id) === String(id));
        
        setFormData({
            ...formData,
            kegiatan_id: id,
            nama_kegiatan: selectedKegiatan?.kegiatan || "",
            mak: selectedKegiatan?.mak || "",
            maksud_tugas: selectedKegiatan?.maksud_tugas || ""
        });
    };

    const addPetugas = () => {
        if (!selectedPetugasId) return;
        const petugasObj = optPetugas.find((p: any) => String(p.id) === String(selectedPetugasId));
        if (!petugasObj) return;
        
        if (formData.list_petugas.some((p: any) => String(p.id) === String(selectedPetugasId))) {
            alert("Petugas sudah ada dalam daftar.");
            return;
        }

        setFormData({
            ...formData,
            list_petugas: [
                ...formData.list_petugas, 
                { 
                    id: petugasObj.id, 
                    nm_petugas: petugasObj.nm_petugas,
                    jabatan: petugasObj.jabatan || petugasObj.Jabatan || petugasObj.pangkat || petugasObj.Pangkat || ""
                }
            ]
        });
        setSelectedPetugasId("");
    };

    const removePetugas = (petugasId: number) => {
        setFormData({
            ...formData,
            list_petugas: formData.list_petugas.filter((p: any) => String(p.id) !== String(petugasId))
        });
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.list_petugas.length === 0) {
            toast.error("Anda belum memilih data Petugas!");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            "nomor-surat": formData.nomor_surat,
            "tanggal-surat": formData.tanggal_surat, 
            "kegiatan": formData.kegiatan_id,
            "nama-kegiatan": formData.nama_kegiatan,
            "mak": formData.mak,
            "maksud-tugas": formData.maksud_tugas,
            "wilayah-tugas": formData.wilayah_tugas,
            "tanggal-dari": formData.tanggal_dari,
            "tanggal-sampai": formData.tanggal_sampai,
            "user_id": user?.id,
            "list-petugas": JSON.stringify(formData.list_petugas.map(p => ({ id: p.id })))
        };

        try {
            const request = formData.id 
                ? api.put(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st/${formData.id}`, payload)
                : api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st`, payload);

            const res = await request;
            toast.success(res.data?.msg || "Data berhasil disimpan");
            setIsFormOpen(false);
            fetchData();
        } catch (err: any) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const errors = err.response.data.errors;
                if (errors['nomor-surat']) {
                    toast.warning("Peringatan: Nomor Surat ini sudah digunakan! Silakan periksa kembali.");
                } else {
                    const errorKeys = Object.keys(errors);
                    toast.warning(errors[errorKeys[0]][0]);
                }
            } else {
                toast.error(err.response?.data?.message || "Gagal menyimpan data");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStartingNumber = () => {
        if (!paginationData?.meta?.current_page && !paginationData?.current_page) return 1;
        const page = paginationData?.meta?.current_page || paginationData?.current_page;
        return (page - 1) * parseInt(perPage) + 1;
    };

    const currentTampilDari = getStartingNumber();
    const currentTampilSampai = currentTampilDari + suratTugas.length - 1;
    const isPaginationValid = (paginationData?.meta?.links || paginationData?.links) && (paginationData?.meta?.last_page > 1 || paginationData?.last_page > 1);

    if (isShowOpen && showData) {
        const renderTanggalTugas = () => {
            const dari = dayjs(showData.tanggal_dari).format('DD MMMM YYYY');
            const sampai = dayjs(showData.tanggal_sampai).format('DD MMMM YYYY');
            return dari === sampai ? dari : `${dari} - ${sampai}`;
        };

        const pembuatNama = showData.user?.name || '-';
        const pembuatFungsi = showData.user?.employee?.fungsi?.name || '-';

        return (
            <div className="py-8 px-4 sm:px-8 w-full max-w-full overflow-hidden">
                <div className="max-w-[1400px] mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8">
                        Informasi Surat Tugas
                    </h1>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden max-w-4xl">
                        <div className="p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{showData.nomor_surat}</h2>
                                        <p className="text-slate-500 font-medium flex items-center gap-1 mt-1">
                                            <span className="material-symbols-outlined text-[16px]">event</span> 
                                            {dayjs(showData.tanggal_surat).format('DD MMMM YYYY')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dibuat Oleh</p>
                                    <p className="text-slate-800 font-bold">{pembuatNama}</p>
                                    <p className="text-xs text-slate-500">{pembuatFungsi}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Tugas</p>
                                    <p className="text-slate-800 font-medium inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <span className="material-symbols-outlined text-[18px] text-slate-400">date_range</span>
                                        {renderTanggalTugas()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wilayah Tujuan</p>
                                    <p className="text-slate-800 font-medium inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <span className="material-symbols-outlined text-[18px] text-teal-600">location_on</span>
                                        {showData.wilayah_tugas}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Kegiatan</p>
                                    <p className="text-slate-800 font-medium text-lg">{showData.nama_kegiatan}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kode MAK</p>
                                    <p className="text-slate-800 font-medium">{showData.mak_kegiatan}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Maksud Tugas</p>
                                    <p className="text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                                        {showData.maksud_tugas}
                                    </p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daftar Petugas ({showData.list_petugas?.length || 0})</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {showData.list_petugas?.map((lp: any, i: number) => {
                                            const sub = lp.petugas?.Jabatan || lp.petugas?.jabatan || lp.petugas?.Pangkat;
                                            return (
                                                <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                                                    <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-slate-700 truncate">
                                                            {lp.petugas?.nm_petugas || 'Petugas Tidak Diketahui'}
                                                        </span>
                                                        {sub && (
                                                            <span className="text-xs text-slate-500 truncate">
                                                                {sub}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                <button 
                                    onClick={() => setIsShowOpen(false)} 
                                    className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm"
                                >
                                    Kembali ke Daftar
                                </button>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button 
                                        onClick={() => handleDownloadFile(showData, 'docx')} 
                                        disabled={downloadingFormat !== null}
                                        className="py-2.5 px-4 bg-[#2b579a] hover:bg-[#1e3e6f] disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-sm text-sm flex items-center gap-2 cursor-pointer"
                                    >
                                        {downloadingFormat === 'docx' ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[18px]">description</span>
                                        )}
                                        <span>Unduh Word (.docx)</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDownloadFile(showData, 'pdf')} 
                                        disabled={downloadingFormat !== null}
                                        className="py-2.5 px-4 bg-[#ea4335] hover:bg-[#c5221f] disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-sm text-sm flex items-center gap-2 cursor-pointer"
                                    >
                                        {downloadingFormat === 'pdf' ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                        )}
                                        <span>Unduh PDF (.pdf)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isFormOpen) {
        return (
            <div className="py-8 px-4 sm:px-8 w-full max-w-full overflow-hidden">
                <div className="max-w-[1400px] mx-auto">
                    <div className="text-sm text-slate-500 mb-2">
                        Surat Tugas (ST) <span className="mx-1">&gt;</span> <span className="text-teal-700 font-medium">Form</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8">
                        {formData.id ? 'Ubah' : 'Tambah'} Data Surat Tugas
                    </h1>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={handleFormSubmit} id="main">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                    <div className="flex flex-col">
                                        <label className="mb-2 text-sm font-semibold text-slate-700">Nomor Surat</label>
                                        <input 
                                            type="text" 
                                            className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full" 
                                            value={formData.nomor_surat}
                                            onChange={(e) => setFormData({...formData, nomor_surat: e.target.value})}
                                            placeholder="Cth: ST.02.01/BBPOM..."
                                            required 
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-2 text-sm font-semibold text-slate-700">Tanggal Surat</label>
                                        <input 
                                            type="date" 
                                            className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full" 
                                            value={formData.tanggal_surat}
                                            onChange={(e) => setFormData({...formData, tanggal_surat: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-2 text-sm font-semibold text-slate-700">Rentang Waktu Tugas</label>
                                        <div className="flex items-center gap-2 w-full">
                                            <input 
                                                type="date" 
                                                className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-3 text-slate-700 w-full text-sm" 
                                                value={formData.tanggal_dari}
                                                onChange={(e) => setFormData({...formData, tanggal_dari: e.target.value})}
                                                required 
                                            />
                                            <span className="text-slate-400 font-bold">-</span>
                                            <input 
                                                type="date" 
                                                className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-3 text-slate-700 w-full text-sm" 
                                                value={formData.tanggal_sampai}
                                                onChange={(e) => setFormData({...formData, tanggal_sampai: e.target.value})}
                                                required 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <div className="flex flex-col">
                                        <label className="mb-2 text-sm font-semibold text-slate-700">Kegiatan Terkait</label>
                                        <SearchableSelect 
                                            options={optKegiatan.map((k: any) => ({
                                                value: String(k.id),
                                                label: k.kegiatan,
                                                sublabel: k.mak ? `MAK: ${k.mak}` : undefined
                                            }))}
                                            value={formData.kegiatan_id}
                                            onChange={(val) => {
                                                const selectedKegiatan = optKegiatan.find((k: any) => String(k.id) === String(val));
                                                setFormData({
                                                    ...formData,
                                                    kegiatan_id: val,
                                                    nama_kegiatan: selectedKegiatan?.kegiatan || "",
                                                    mak: selectedKegiatan?.mak || "",
                                                    maksud_tugas: selectedKegiatan?.maksud_tugas || ""
                                                });
                                            }}
                                            placeholder="-- Pilih Kegiatan --"
                                            searchPlaceholder="Ketik untuk mencari kegiatan..."
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="mb-2 text-sm font-semibold text-slate-700">Kode MAK (Otomatis)</label>
                                        <input 
                                            type="text" 
                                            className="bg-slate-100 rounded-xl border border-slate-200 focus:outline-none py-3 px-4 text-slate-500 w-full cursor-not-allowed" 
                                            value={formData.mak}
                                            readOnly
                                            placeholder="Terisi setelah memilih kegiatan"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col mb-6 w-full">
                                    <label className="mb-2 text-sm font-semibold text-slate-700">Maksud Tugas</label>
                                    <textarea 
                                        rows={3} 
                                        className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full resize-none"
                                        value={formData.maksud_tugas}
                                        onChange={(e) => setFormData({...formData, maksud_tugas: e.target.value})}
                                        required
                                        placeholder="Tuliskan detail rincian dari maksud penugasan..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 pb-6 border-b border-slate-100">
                                    <div className="flex flex-col">
                                        <label className="mb-2 text-sm font-semibold text-slate-700">Wilayah Penugasan</label>
                                        <SearchableSelect 
                                            options={optWilayah.map((w: any) => ({
                                                value: w.name,
                                                label: w.name
                                            }))}
                                            value={formData.wilayah_tugas}
                                            onChange={(val) => setFormData({...formData, wilayah_tugas: val})}
                                            placeholder="-- Pilih Wilayah --"
                                            searchPlaceholder="Ketik untuk mencari wilayah..."
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="mb-2 text-sm font-semibold text-slate-700">Tim Petugas Lapangan</label>
                                        <div className="flex gap-2 w-full mb-3">
                                            <div className="flex-1 min-w-0">
                                                <SearchableSelect 
                                                    options={optPetugas.map((p: any) => ({
                                                        value: String(p.id),
                                                        label: p.nm_petugas
                                                    }))}
                                                    value={selectedPetugasId}
                                                    onChange={(val) => setSelectedPetugasId(val)}
                                                    placeholder="-- Cari & Pilih Petugas --"
                                                    searchPlaceholder="Ketik nama petugas..."
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={addPetugas} 
                                                className="bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl px-4 transition-colors shrink-0 h-[46px] flex items-center justify-center cursor-pointer"
                                            >
                                                Tambah
                                            </button>
                                        </div>

                                        {formData.list_petugas.length > 0 ? (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daftar Petugas Terpilih ({formData.list_petugas.length})</h3>
                                                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                                                    {formData.list_petugas.map((p: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm hover:border-slate-300 transition-colors">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <span className="w-6 h-6 rounded bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-sm text-slate-800 font-semibold truncate">{p.nm_petugas}</span>
                                                                    {p.jabatan && (
                                                                        <span className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                                                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                                                                            {p.jabatan}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removePetugas(p.id)} 
                                                                className="text-slate-400 hover:text-red-500 transition-colors shrink-0 tooltip tooltip-left p-1"
                                                                data-tip="Hapus dari daftar"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">group_add</span>
                                                <p className="text-sm">Belum ada petugas yang dipilih</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsFormOpen(false)} 
                                        className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                                    >
                                        Batal & Kembali
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="py-3 px-8 bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded-xl transition-all flex items-center justify-center min-w-[120px]"
                                    >
                                        {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Simpan Data ST"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-8 px-4 sm:px-8 w-full max-w-full overflow-hidden">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manajemen Surat Tugas</h1>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={handleOpenAdd}
                            className="bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Buat Surat Tugas Baru
                        </button>
                    </div>
                </div>

                {/* TABEL LANGSUNG DIMULAI DI SINI TANPA CARD SUMMARY */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mb-8">
                    
                    {/* Toolbar Search & Filter */}
                    <div className="p-4 border-b border-slate-100 bg-white flex flex-col xl:flex-row gap-4 justify-between items-center">
                        <form onSubmit={handleSearchSubmit} className="flex items-center w-full xl:w-auto flex-1 max-w-2xl bg-[#f4f6f8] rounded-xl px-4 py-2.5 transition-all">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                            <input 
                                type="text" 
                                placeholder="Cari berdasarkan nama kegiatan..."
                                className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full ml-3 text-slate-700 placeholder:text-slate-400"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <button type="submit" className="hidden">Submit</button>
                        </form>

                        <div className="flex items-center gap-3 w-full xl:w-auto">
                            <div className="flex items-center gap-2 bg-[#f4f6f8] rounded-xl px-4 py-2.5">
                                <span className="text-sm text-slate-500">Baris:</span>
                                <select 
                                    className="bg-transparent border-none focus:outline-none text-sm font-medium text-slate-700 cursor-pointer pr-2" 
                                    value={perPage} 
                                    onChange={(e) => {
                                        setPerPage(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                            
                            <button 
                                type="button"
                                onClick={handleResetSearch}
                                className="bg-[#f4f6f8] hover:bg-slate-200 rounded-xl p-2.5 text-slate-600 transition-colors flex items-center justify-center tooltip"
                                data-tip="Muat Ulang"
                            >
                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white border-b border-slate-100 text-slate-800 font-bold text-[11px] uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-5 text-center w-16">No</th>
                                    <th className="px-6 py-5 text-center w-40">Aksi</th>
                                    <th className="px-6 py-5">Nomor ST</th>
                                    <th className="px-6 py-5">Tujuan & Waktu</th>
                                    <th className="px-6 py-5">Kegiatan Terkait</th>
                                    <th className="px-6 py-5">Tim Petugas</th>
                                    <th className="px-6 py-5">Dibuat Oleh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            <span className="loading loading-spinner loading-lg text-teal-600"></span>
                                            <p className="mt-3 text-sm font-medium">Memuat data surat tugas...</p>
                                        </td>
                                    </tr>
                                ) : suratTugas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
                                                <p className="text-sm font-medium">Data surat tugas tidak ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    suratTugas.map((item: any, index: number) => {
                                        const tglDari = dayjs(item.tanggal_dari).format('DD MMM YYYY');
                                        const tglSampai = dayjs(item.tanggal_sampai).format('DD MMM YYYY');
                                        const tglTugas = tglDari === tglSampai ? tglDari : `${tglDari} - ${tglSampai}`;

                                        const pembuatNama = item.user?.name || '-';
                                        const pembuatFungsi = item.user?.employee?.fungsi?.name || '-';

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors align-top">
                                                <td className="px-6 py-5 text-center font-medium text-slate-500">{getStartingNumber() + index}</td>
                                                
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex flex-wrap justify-center items-center gap-1.5 min-w-[120px]">
                                                        <button onClick={() => handleOpenShow(item)} className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors tooltip tooltip-top" data-tip="Lihat">
                                                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                        </button>
                                                        <button onClick={() => setDownloadModalItem(item)} className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors tooltip tooltip-top" data-tip="Unduh Berkas ST">
                                                            <span className="material-symbols-outlined text-[16px]">download</span>
                                                        </button>
                                                        <button onClick={() => handleOpenEdit(item)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors tooltip tooltip-bottom" data-tip="Edit">
                                                            <span className="material-symbols-outlined text-[16px]">edit_square</span>
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors tooltip tooltip-bottom" data-tip="Hapus">
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-slate-800">{item.nomor_surat}</div>
                                                    <div className="text-[11px] text-slate-500 mt-1 inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                                                        <span className="material-symbols-outlined text-[12px]">edit_calendar</span> 
                                                        {dayjs(item.tanggal_surat).format('DD MMM YYYY')}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="font-semibold text-slate-700">{item.wilayah_tugas}</div>
                                                    <div className="text-xs text-slate-500 mt-1">{tglTugas}</div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="font-medium text-slate-800 max-w-[250px] truncate" title={item.nama_kegiatan}>
                                                        {item.nama_kegiatan}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">MAK: <span className="font-semibold text-slate-700">{item.mak_kegiatan}</span></div>
                                                </td>
                                                
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1 min-w-[200px]">
                                                        {item.list_petugas?.map((lp: any, idx: number) => (
                                                            <div key={idx} className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 truncate font-medium flex items-center gap-2" title={lp.petugas?.nm_petugas}>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                                                                {lp.petugas?.nm_petugas || `Petugas ID: ${lp.petugas_id}`}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    {item.user ? (
                                                        <div className="flex flex-col bg-[#f8fafa] px-3 py-2 rounded-lg border border-slate-100">
                                                            <span className="font-bold text-slate-700 whitespace-nowrap">{pembuatNama}</span>
                                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 whitespace-nowrap">{pembuatFungsi}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">- Sistem -</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
                        <span className="text-xs font-medium text-slate-500">
                            Menampilkan <span className="font-bold text-slate-800">{suratTugas.length > 0 ? currentTampilDari : 0}</span> s/d <span className="font-bold text-slate-800">{suratTugas.length > 0 ? currentTampilSampai : 0}</span> dari <span className="font-bold text-slate-800">{totalData}</span> data
                        </span>

                        {isPaginationValid && (
                            <div className="flex items-center gap-1">
                                {(paginationData?.meta?.links || paginationData?.links).map((link: any, i: number) => {
                                    const isPrev = link.label.includes('Previous') || link.label.includes('Sebelumnya');
                                    const isNext = link.label.includes('Next') || link.label.includes('Berikutnya');
                                    
                                    let displayLabel = link.label;
                                    if (isPrev) displayLabel = '< Sebelumnya';
                                    if (isNext) displayLabel = 'Berikutnya >';

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (link.url) fetchData(link.url);
                                            }}
                                            disabled={!link.url}
                                            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                                                link.active 
                                                    ? 'bg-[#0f172a] text-white shadow-md' 
                                                    : 'bg-[#f4f6f8] text-slate-600 hover:bg-slate-200 border border-transparent'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed bg-transparent hover:bg-transparent' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: displayLabel }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl transform transition-all">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Data?</h3>
                            <p className="text-slate-500 mb-6 text-sm">
                                Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={executeDelete}
                                    className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pilihan Format Unduh Surat Tugas (Word / PDF) */}
            {downloadModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all">
                        {/* Header */}
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div>
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[11px] font-bold mb-1.5 uppercase tracking-wide">
                                    <span className="material-symbols-outlined text-[13px]">download</span>
                                    Unduh Surat Tugas
                                </div>
                                <h3 className="text-base font-bold text-slate-800 line-clamp-1" title={downloadModalItem.nomor_surat}>
                                    {downloadModalItem.nomor_surat}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={downloadModalItem.nama_kegiatan}>
                                    {downloadModalItem.nama_kegiatan}
                                </p>
                            </div>
                            <button 
                                onClick={() => !downloadingFormat && setDownloadModalItem(null)}
                                disabled={downloadingFormat !== null}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        {/* Pilihan Format */}
                        <div className="py-5">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3.5">
                                Pilih Format Berkas:
                            </p>
                            <div className="grid grid-cols-2 gap-3.5">
                                {/* Format Word */}
                                <div 
                                    onClick={() => !downloadingFormat && handleDownloadFile(downloadModalItem, 'docx')}
                                    className={`group rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center cursor-pointer select-none ${
                                        downloadingFormat === 'docx'
                                            ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                                            : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-400 hover:shadow-md'
                                    }`}
                                >
                                    {/* Icon Word */}
                                    <div className="mb-3 w-14 h-16 flex items-center justify-center transition-transform group-hover:scale-105">
                                        <img 
                                            src="/assets/images/doc-icon.png" 
                                            alt="DOCX" 
                                            className="w-13 h-15 object-contain drop-shadow-sm"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.parentElement?.querySelector('.icon-fallback');
                                                if (fallback) (fallback as HTMLElement).style.display = 'block';
                                            }}
                                        />
                                        <div className="icon-fallback" style={{ display: 'none' }}>
                                            <svg className="w-12 h-14 drop-shadow-sm" viewBox="0 0 56 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 0C2.68629 0 0 2.68629 0 6V58C0 61.3137 2.68629 64 6 64H50C53.3137 64 56 61.3137 56 58V18L38 0H6Z" fill="#2B579A" />
                                                <path d="M38 0V14C38 16.2091 39.7909 18 42 18H56L38 0Z" fill="#1E3E6F" />
                                                <text x="28" y="44" fill="white" fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.5">DOCX</text>
                                            </svg>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                                        Microsoft Word
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-0.5 mb-3 font-medium">
                                        Format .docx (Editable)
                                    </span>
                                    <button
                                        disabled={downloadingFormat !== null}
                                        className="w-full mt-auto py-2 px-2.5 bg-[#2B579A] hover:bg-[#1E3E6F] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        {downloadingFormat === 'docx' ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span className="text-[11px]">Mengunduh...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[15px]">download</span>
                                                <span>Unduh Word</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Format PDF */}
                                <div 
                                    onClick={() => !downloadingFormat && handleDownloadFile(downloadModalItem, 'pdf')}
                                    className={`group rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center cursor-pointer select-none ${
                                        downloadingFormat === 'pdf'
                                            ? 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-500/20'
                                            : 'bg-white hover:bg-red-50/50 border-slate-200 hover:border-red-400 hover:shadow-md'
                                    }`}
                                >
                                    {/* Icon PDF */}
                                    <div className="mb-3 w-14 h-16 flex items-center justify-center transition-transform group-hover:scale-105">
                                        <img 
                                            src="/assets/images/pdf-icon.png" 
                                            alt="PDF" 
                                            className="w-13 h-15 object-contain drop-shadow-sm"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.parentElement?.querySelector('.icon-fallback');
                                                if (fallback) (fallback as HTMLElement).style.display = 'block';
                                            }}
                                        />
                                        <div className="icon-fallback" style={{ display: 'none' }}>
                                            <svg className="w-12 h-14 drop-shadow-sm" viewBox="0 0 56 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 0C2.68629 0 0 2.68629 0 6V58C0 61.3137 2.68629 64 6 64H50C53.3137 64 56 61.3137 56 58V18L38 0H6Z" fill="#EA4335" />
                                                <path d="M38 0V14C38 16.2091 39.7909 18 42 18H56L38 0Z" fill="#D32F2F" />
                                                <text x="28" y="44" fill="white" fontSize="13" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.5">PDF</text>
                                            </svg>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-800 text-sm group-hover:text-red-700 transition-colors">
                                        Dokumen PDF
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-0.5 mb-3 font-medium">
                                        Format .pdf (Siap Cetak)
                                    </span>
                                    <button
                                        disabled={downloadingFormat !== null}
                                        className="w-full mt-auto py-2 px-2.5 bg-[#EA4335] hover:bg-[#C5221F] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        {downloadingFormat === 'pdf' ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span className="text-[11px]">Mengunduh...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[15px]">download</span>
                                                <span>Unduh PDF</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                <span className="material-symbols-outlined text-[14px] text-teal-600">verified</span>
                                Resmi BBPOM di Mataram
                            </span>
                            <button
                                onClick={() => setDownloadModalItem(null)}
                                disabled={downloadingFormat !== null}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors text-xs cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}