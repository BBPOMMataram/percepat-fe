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
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/kegiatan?limit=1000`).then(res => setOptKegiatan(res.data?.data || res.data));
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/wilayah?limit=1000`).then(res => setOptWilayah(res.data?.data || res.data));
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/petugas?limit=1000`).then(res => setOptPetugas(res.data?.data || res.data));
    };

    const fetchData = useCallback((url?: string) => {
        setLoading(true);
        let endpoint = url || `${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st?page=${currentPage}&value_per_page=${perPage}&name=${activeSearch}`;

        api.get(endpoint)
            .then((res) => {
                const responseData = res.data;
                if (Array.isArray(responseData)) {
                    setSuratTugas(responseData);
                } else if (Array.isArray(responseData?.data)) {
                    setSuratTugas(responseData.data);
                    setPaginationData(responseData);
                } else if (Array.isArray(responseData?.data?.data)) {
                    setSuratTugas(responseData.data.data);
                    setPaginationData(responseData.data);
                }
                setLoading(false);
            })
            .catch((err) => {
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
        window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/download-st/${id}`, "_blank");
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
            api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st/${id}`)
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

        const request = formData.id 
            ? api.put(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st/${formData.id}`, payload)
            : api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA}/api/st`, payload);

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

    if (isShowOpen && showData) {
        const renderTanggalTugas = () => {
            const dari = dayjs(showData.tanggal_dari).format('DD MMMM YYYY');
            const sampai = dayjs(showData.tanggal_sampai).format('DD MMMM YYYY');
            return dari === sampai ? dari : `${dari} - ${sampai}`;
        };

        const pembuatNama = showData.user?.name || '-';
        const pembuatFungsi = showData.user?.employee?.fungsi?.name || '-';

        return (
            <div className="py-12 w-full min-w-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
                    <div className="bg-secondary text-secondary-content overflow-hidden shadow-sm sm:rounded-lg w-full min-w-0">
                        <div className="p-8 [&>div]:mb-3">
                            <h2 className="text-2xl uppercase mb-8 font-bold">Data <b>{showData.nomor_surat}</b></h2>
                            
                            <div className="text-lg">
                                Dibuat Oleh : <strong className="text-primary">{pembuatNama} ({pembuatFungsi})</strong>
                            </div>
                            
                            <div className="text-lg mt-6">Nomor ST : <strong>{showData.nomor_surat}</strong></div>
                            <div className="text-lg">Tanggal Surat : <strong>{dayjs(showData.tanggal_surat).format('DD MMMM YYYY')}</strong></div>
                            <div className="text-lg">Tanggal Tugas : <strong>{renderTanggalTugas()}</strong></div>
                            <div className="text-lg">Nama Kegiatan : <strong>{showData.nama_kegiatan}</strong></div>
                            <div className="text-lg">MAK Kegiatan : <strong>{showData.mak_kegiatan}</strong></div>
                            <div className="text-lg">Maksud Tugas : <strong>{showData.maksud_tugas}</strong></div>
                            <div className="text-lg">Wilayah : <strong>{showData.wilayah_tugas}</strong></div>
                            <div className="text-lg mt-4">Petugas : 
                                <ul className="list-disc list-inside mt-2 ml-4">
                                    {showData.list_petugas?.map((lp: any, i: number) => (
                                        <li key={i} className="font-semibold">{lp.petugas?.nm_petugas || 'Petugas'}</li>
                                    ))}
                                </ul>
                            </div>
                            
                            <button 
                                onClick={() => setIsShowOpen(false)} 
                                className="py-2.5 px-6 bg-gray-500 hover:bg-gray-600 text-gray-50 text-center mt-8 rounded transition-colors inline-block"
                            >
                                Kembali
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isFormOpen) {
        return (
            <div className="py-12 w-full min-w-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
                    <div className="bg-secondary text-secondary-content overflow-hidden shadow-sm rounded-lg w-full min-w-0">
                        <div className="p-8">
                            <h2 className="text-xl uppercase mb-8 font-bold">
                                {formData.id ? 'Ubah' : 'Tambah'} Data Surat Tugas
                            </h2>
                            
                            <form onSubmit={handleFormSubmit} id="main">
                                <div className="form-container flex flex-col gap-6 w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        <div className="flex flex-col min-w-0">
                                            <label className="mb-2 text-sm">Nomor Surat</label>
                                            <input 
                                                type="text" 
                                                className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full" 
                                                value={formData.nomor_surat}
                                                onChange={(e) => setFormData({...formData, nomor_surat: e.target.value})}
                                                placeholder="Nomor Surat"
                                                required 
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <label className="mb-2 text-sm">Tanggal Surat</label>
                                            <input 
                                                type="date" 
                                                className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full" 
                                                value={formData.tanggal_surat}
                                                onChange={(e) => setFormData({...formData, tanggal_surat: e.target.value})}
                                                required 
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <label className="mb-2 text-sm">Tanggal Tugas</label>
                                            <div className="flex items-center gap-2 w-full">
                                                <input 
                                                    type="date" 
                                                    className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
                                                    value={formData.tanggal_dari}
                                                    onChange={(e) => setFormData({...formData, tanggal_dari: e.target.value})}
                                                    required 
                                                />
                                                <span>-</span>
                                                <input 
                                                    type="date" 
                                                    className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
                                                    value={formData.tanggal_sampai}
                                                    onChange={(e) => setFormData({...formData, tanggal_sampai: e.target.value})}
                                                    required 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                        <div className="flex flex-col min-w-0">
                                            <label className="mb-2 text-sm">Kegiatan</label>
                                            <select 
                                                className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full"
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
                                        <div className="flex flex-col min-w-0">
                                            <label className="mb-2 text-sm">MAK</label>
                                            <input 
                                                type="text" 
                                                className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content opacity-70 w-full" 
                                                value={formData.mak}
                                                onChange={(e) => setFormData({...formData, mak: e.target.value})}
                                                placeholder="Terisi Otomatis"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col min-w-0 w-full">
                                        <label className="font-semibold mb-2 text-sm">Maksud Tugas</label>
                                        <textarea 
                                            rows={3} 
                                            className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content resize-none"
                                            value={formData.maksud_tugas}
                                            onChange={(e) => setFormData({...formData, maksud_tugas: e.target.value})}
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                                        <div className="flex flex-col min-w-0">
                                            <label className="mb-2 text-sm">Wilayah</label>
                                            <select 
                                                className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full"
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
                                        <div className="flex flex-col min-w-0">
                                            <label className="mb-2 text-sm">Petugas</label>
                                            <div className="flex gap-2 w-full">
                                                <select 
                                                    className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full"
                                                    value={selectedPetugasId}
                                                    onChange={(e) => setSelectedPetugasId(e.target.value)}
                                                >
                                                    <option value="">-- Pilih Petugas --</option>
                                                    {optPetugas.map((p: any) => (
                                                        <option key={p.id} value={p.id}>{p.nm_petugas}</option>
                                                    ))}
                                                </select>
                                                <button type="button" onClick={addPetugas} className="btn btn-primary btn-sm h-full rounded shrink-0">
                                                    Tambah
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {formData.list_petugas.length > 0 && (
                                        <div className="border-2 border-primary/30 rounded p-4 w-full md:w-1/2 mt-2">
                                            <h2 className="text-lg font-bold mb-2 text-primary">List Petugas :</h2>
                                            <ul className="list-decimal list-inside flex flex-col gap-2">
                                                {formData.list_petugas.map((p: any, i: number) => (
                                                    <li key={i} className="flex justify-between items-center bg-base-100/10 px-2 py-1 rounded">
                                                        <span className="truncate pr-2">{p.nm_petugas}</span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removePetugas(p.id)} 
                                                            className="text-red-500 hover:scale-110 shrink-0"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 max-w-[280px] mt-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsFormOpen(false)} 
                                            className="py-2.5 px-4 bg-gray-500 hover:bg-gray-600 text-gray-50 text-center rounded transition-colors"
                                        >
                                            Kembali
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="py-2.5 px-4 bg-primary hover:brightness-110 text-primary-content rounded transition-all flex justify-center items-center"
                                        >
                                            {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Simpan"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-12 w-full min-w-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-w-0">
                <div className="p-4 sm:p-6 py-10 bg-secondary text-secondary-content rounded-lg shadow-sm w-full min-w-0">
                    
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4 w-full min-w-0">
                        <button 
                            onClick={handleOpenAdd}
                            className="bg-primary text-primary-content rounded px-4 py-2 inline-block hover:brightness-110 transition-all shrink-0"
                        >
                            <span className="material-symbols-outlined text-[18px] translate-y-1">add</span>
                        </button>

                        <span className="ml-auto">
                            <form onSubmit={handleSearchSubmit} className="flex [&_option]:bg-secondary items-center gap-2 flex-wrap justify-end">
                                <div className="tooltip" data-tip="Data per halaman">
                                    <select 
                                        className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
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
                                <div className="tooltip" data-tip="Cari Berdasarkan">
                                    <select 
                                        className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
                                        value={searchBy}
                                        onChange={(e) => {
                                            setSearchBy(e.target.value);
                                            setSearchInput("");
                                        }}
                                    >
                                        <option value="nama">Nama Kegiatan</option>
                                    </select>
                                </div>
                                <div className="inline-flex items-center bg-primary/5 rounded border-transparent border-b border-b-primary focus-within:border-b-primary px-3 py-1">
                                    <input 
                                        type="text" 
                                        placeholder={`Cari...`}
                                        className="border-transparent focus:outline-none bg-transparent text-secondary-content w-full max-w-[150px] sm:max-w-[200px]"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                    />
                                    <button 
                                        type="submit" 
                                        className="bg-primary/70 hover:bg-primary py-1 px-2 rounded-full cursor-pointer hover:scale-105 text-primary-content transition-all ml-2 flex items-center justify-center shrink-0"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">search</span>
                                    </button>
                                </div>
                            </form>
                        </span>
                    </div>

                    <div className="w-full min-w-0 overflow-x-auto rounded-lg">
                        <table className="table w-full text-sm whitespace-nowrap mb-2 min-w-max">
                            <thead>
                                <tr className="text-left border-b leading-9 bg-primary text-primary-content border-b-yellow-100 [&>th]:px-4 [&>th]:py-3">
                                    <th className="text-center w-12">No</th>
                                    <th className="text-center">Aksi</th>
                                    <th>Nomor ST</th>
                                    <th>Wilayah Tugas</th>
                                    <th>Tanggal Surat</th>
                                    <th>Tanggal Tugas</th>
                                    <th>Nama Kegiatan</th>
                                    <th>MAK Kegiatan</th>
                                    <th>Maksud Tugas</th>
                                    <th>Petugas</th>
                                    <th className="min-w-[150px]">Pembuat Surat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="text-center py-8 text-gray-400">
                                            <span className="loading loading-spinner loading-md"></span> Memuat data...
                                        </td>
                                    </tr>
                                ) : suratTugas.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="text-center py-8 text-gray-400">
                                            Data surat tugas tidak ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    suratTugas.map((item: any, index: number) => {
                                        const tglDari = dayjs(item.tanggal_dari).format('DD MMMM YYYY');
                                        const tglSampai = dayjs(item.tanggal_sampai).format('DD MMMM YYYY');
                                        const tglTugas = tglDari === tglSampai ? tglDari : `${tglDari} - ${tglSampai}`;

                                        const pembuatNama = item.user?.name || '-';
                                        const pembuatFungsi = item.user?.employee?.fungsi?.name || '-';

                                        return (
                                        <tr 
                                            key={item.id} 
                                            className="border-b odd:bg-white/5 odd:text-accent-content hover:bg-primary hover:text-primary-content transition-colors align-top [&>td]:px-4 [&>td]:py-3"
                                        >
                                            <td className="text-center font-medium">{getStartingNumber() + index}</td>
                                            
                                            <td className="w-24">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button onClick={() => handleDelete(item.id)} className="hover:scale-110 transition-transform tooltip tooltip-bottom" data-tip="Hapus">
                                                        <span className="material-symbols-outlined text-red-500 text-[18px]">delete</span>
                                                    </button>
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:scale-110 transition-transform tooltip tooltip-bottom" data-tip="Edit">
                                                        <span className="material-symbols-outlined text-blue-500 text-[18px]">edit</span>
                                                    </button>
                                                    <button onClick={() => handleOpenShow(item)} className="hover:scale-110 transition-transform tooltip tooltip-bottom" data-tip="Lihat">
                                                        <span className="material-symbols-outlined text-teal-500 text-[18px]">visibility</span>
                                                    </button>
                                                    <button onClick={() => handleDownload(item.id)} className="hover:scale-110 transition-transform tooltip tooltip-bottom" data-tip="Download">
                                                        <span className="material-symbols-outlined text-yellow-600 text-[18px]">download</span>
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="font-semibold">{item.nomor_surat}</td>
                                            <td>{item.wilayah_tugas}</td>
                                            <td>{dayjs(item.tanggal_surat).format('DD MMMM YYYY')}</td>
                                            <td>{tglTugas}</td>
                                            <td>{item.nama_kegiatan}</td>
                                            <td>{item.mak_kegiatan}</td>
                                            <td className="whitespace-normal min-w-[250px] leading-relaxed">{item.maksud_tugas}</td>
                                            
                                            <td>
                                                <ol className="list-decimal ml-4 min-w-[180px]">
                                                    {item.list_petugas?.map((lp: any, idx: number) => (
                                                        <li key={idx} className="border-b border-primary/20 mb-1 pb-1">
                                                            {lp.petugas?.nm_petugas || `Petugas ID: ${lp.petugas_id}`}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </td>

                                            <td className="min-w-[150px]">
                                                {item.user ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-primary whitespace-nowrap">{pembuatNama}</span>
                                                        <span className="text-xs opacity-70 whitespace-nowrap">{pembuatFungsi}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 italic">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )})
                                )}
                            </tbody>
                        </table>
                    </div>

                    {(paginationData?.meta?.links || paginationData?.links) && (paginationData?.meta?.last_page > 1 || paginationData?.last_page > 1) && (
                        <div className="[&_p]:!text-secondary-content [&_.bg-white]:bg-primary [&_.bg-white]:text-primary-content mt-6">
                            <div className="flex justify-center items-center gap-1 flex-wrap">
                                {(paginationData?.meta?.links || paginationData?.links).map((link: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (link.url) fetchData(link.url);
                                        }}
                                        disabled={!link.url}
                                        className={`px-3 py-1 rounded border border-gray-600/30 text-sm ${
                                            link.active ? 'bg-primary text-primary-content font-bold' : 'bg-transparent text-secondary-content hover:bg-white/10'
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}