"use client";

import api from "@/utils/api";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

export default function MasterSuratTugas() {
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

    const fetchOptions = () => {
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        api.get(`${baseURL}/api/kegiatan?limit=1000`).then(res => setOptKegiatan(res.data?.data || res.data));
        api.get(`${baseURL}/api/wilayah?limit=1000`).then(res => setOptWilayah(res.data?.data || res.data));
        api.get(`${baseURL}/api/petugas?limit=1000`).then(res => setOptPetugas(res.data?.data || res.data));
    };

    const fetchData = useCallback((url?: string) => {
        setLoading(true);
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        let endpoint = url || `${baseURL}/api/st?page=${currentPage}&value_per_page=${perPage}&name=${activeSearch}`;

        api.get(endpoint)
            .then((res) => {
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
                setLoading(false);
            })
            .catch((err) => {
                console.error("Gagal mengambil data surat tugas:", err);
                toast.error("Gagal mengambil data surat tugas");
                setSuratTugas([]);
                setLoading(false);
            });
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
        const mappedPetugas = item.list_petugas?.map((lp: any) => ({
            id: lp.petugas_id,
            nm_petugas: lp.petugas?.nm_petugas || `Petugas ID: ${lp.petugas_id}`
        })) || [];

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

    const handleDownload = (id: number) => {
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        window.open(`${baseURL}/api/download-st/${id}`, "_blank");
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
            const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
            api.delete(`${baseURL}/api/st/${id}`)
                .then((res) => {
                    toast.success(res.data?.msg || "Data berhasil dihapus");
                    fetchData();
                })
                .catch((err) => {
                    toast.error(err.response?.data?.message || "Gagal menghapus data");
                });
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
        
        if (formData.list_petugas.some((p: any) => String(p.id) === String(selectedPetugasId))) {
            alert("Petugas sudah ada dalam daftar.");
            return;
        }

        setFormData({
            ...formData,
            list_petugas: [...formData.list_petugas, { id: petugasObj.id, nm_petugas: petugasObj.nm_petugas }]
        });
        setSelectedPetugasId("");
    };

    const removePetugas = (petugasId: number) => {
        setFormData({
            ...formData,
            list_petugas: formData.list_petugas.filter((p: any) => String(p.id) !== String(petugasId))
        });
    };

    const handleFormSubmit = (e: React.FormEvent) => {
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
            "list-petugas": JSON.stringify(formData.list_petugas.map(p => ({ id: p.id })))
        };

        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        const request = formData.id 
            ? api.put(`${baseURL}/api/st/${formData.id}`, payload)
            : api.post(`${baseURL}/api/st`, payload);

        request
            .then((res) => {
                toast.success(res.data?.msg || "Data berhasil disimpan");
                setIsFormOpen(false);
                fetchData();
            })
            .catch((err) => {
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
            })
            .finally(() => {
                setIsSubmitting(false);
            });
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
                                        {showData.list_petugas?.map((lp: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                                                <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                    {i + 1}
                                                </div>
                                                <span className="font-semibold text-slate-700 truncate">
                                                    {lp.petugas?.nm_petugas || 'Petugas Tidak Diketahui'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-6 border-t border-slate-100 flex gap-3">
                                <button 
                                    onClick={() => setIsShowOpen(false)} 
                                    className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                                >
                                    Kembali ke Daftar
                                </button>
                                <button 
                                    onClick={() => handleDownload(showData.id)} 
                                    className="py-3 px-6 bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                    Unduh Berkas ST
                                </button>
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
                                        <select 
                                            className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full truncate"
                                            value={formData.kegiatan_id}
                                            onChange={handleKegiatanChange}
                                            required
                                        >
                                            <option value="">-- Pilih Kegiatan --</option>
                                            {optKegiatan.map((k: any) => (
                                                <option key={k.id} value={k.id}>{k.kegiatan}</option>
                                            ))}
                                        </select>
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
                                        <select 
                                            className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full"
                                            value={formData.wilayah_tugas}
                                            onChange={(e) => setFormData({...formData, wilayah_tugas: e.target.value})}
                                            required
                                        >
                                            <option value="">-- Pilih Wilayah --</option>
                                            {optWilayah.map((w: any) => (
                                                <option key={w.id} value={w.name}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="mb-2 text-sm font-semibold text-slate-700">Tim Petugas Lapangan</label>
                                        <div className="flex gap-2 w-full mb-3">
                                            <select 
                                                className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full"
                                                value={selectedPetugasId}
                                                onChange={(e) => setSelectedPetugasId(e.target.value)}
                                            >
                                                <option value="">-- Cari & Pilih Petugas --</option>
                                                {optPetugas.map((p: any) => (
                                                    <option key={p.id} value={p.id}>{p.nm_petugas}</option>
                                                ))}
                                            </select>
                                            <button type="button" onClick={addPetugas} className="bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl px-4 transition-colors shrink-0">
                                                Tambah
                                            </button>
                                        </div>

                                        {formData.list_petugas.length > 0 ? (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Daftar Petugas Terpilih ({formData.list_petugas.length})</h3>
                                                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                                    {formData.list_petugas.map((p: any, i: number) => (
                                                        <div key={i} className="flex justify-between items-center bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <span className="w-6 h-6 rounded bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                                                                <span className="text-sm text-slate-700 font-semibold truncate">{p.nm_petugas}</span>
                                                            </div>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removePetugas(p.id)} 
                                                                className="text-slate-400 hover:text-red-500 transition-colors shrink-0 tooltip tooltip-left"
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
                                                        <button onClick={() => handleDownload(item.id)} className="p-1 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors tooltip tooltip-top" data-tip="Unduh Berkas">
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
        </div>
    );
}