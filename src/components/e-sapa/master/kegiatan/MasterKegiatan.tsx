"use client";

import api from "@/utils/api";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "@/utils/dayjs";

export default function MasterKegiatan() {
    const [kegiatan, setKegiatan] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState("10");
    const [searchInput, setSearchInput] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [paginationData, setPaginationData] = useState<any>(null);
    const [totalData, setTotalData] = useState(0);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        kegiatan: "",
        mak: "",
        maksud_tugas: ""
    });

    const fetchData = useCallback((url?: string) => {
        setLoading(true);
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        let endpoint = url || `${baseURL}/api/kegiatan?page=${currentPage}&value_per_page=${perPage}&name=${activeSearch}`;

        api.get(endpoint)
            .then((res) => {
                const responseData = res.data;
                if (Array.isArray(responseData)) {
                    setKegiatan(responseData);
                    setTotalData(responseData.length);
                } else if (Array.isArray(responseData?.data)) {
                    setKegiatan(responseData.data);
                    setPaginationData(responseData);
                    setTotalData(responseData?.meta?.total || responseData?.total || responseData.data.length);
                } else if (Array.isArray(responseData?.data?.data)) {
                    setKegiatan(responseData.data.data);
                    setPaginationData(responseData.data);
                    setTotalData(responseData.data?.meta?.total || responseData.data?.total || responseData.data.data.length);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Gagal mengambil data kegiatan:", err);
                toast.error("Gagal mengambil data kegiatan");
                setKegiatan([]);
                setLoading(false);
            });
    }, [currentPage, perPage, activeSearch]);

    useEffect(() => {
        fetchData();
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
        setFormData({ id: null, kegiatan: "", mak: "", maksud_tugas: "" });
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        setFormData({
            id: item.id,
            kegiatan: item.kegiatan || "",
            mak: item.mak || "",
            maksud_tugas: item.maksud_tugas || ""
        });
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
            const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
            api.delete(`${baseURL}/api/kegiatan/${id}`)
                .then((res) => {
                    toast.success(res.data?.msg || "Data berhasil dihapus");
                    fetchData();
                })
                .catch((err) => {
                    console.error(err);
                    toast.error(err.response?.data?.message || "Gagal menghapus data");
                });
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            kegiatan: formData.kegiatan,
            mak: formData.mak,
            maksudTugas: formData.maksud_tugas
        };

        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        const request = formData.id 
            ? api.put(`${baseURL}/api/kegiatan/${formData.id}`, payload)
            : api.post(`${baseURL}/api/kegiatan`, payload);

        request
            .then((res) => {
                toast.success(res.data?.msg || "Data berhasil disimpan");
                setIsFormOpen(false);
                fetchData();
            })
            .catch((err) => {
                console.error(err);
                toast.error(err.response?.data?.message || "Gagal menyimpan data");
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

    const countDK = kegiatan.filter(k => k.kegiatan?.toUpperCase().includes('DK')).length;
    const countLK = kegiatan.filter(k => k.kegiatan?.toUpperCase().includes('LK')).length;
    
    const currentTampilDari = getStartingNumber();
    const currentTampilSampai = currentTampilDari + kegiatan.length - 1;
    const isPaginationValid = (paginationData?.meta?.links || paginationData?.links) && (paginationData?.meta?.last_page > 1 || paginationData?.last_page > 1);

    if (isFormOpen) {
        return (
            <div className="py-8 px-4 sm:px-8 w-full max-w-full overflow-hidden">
                <div className="max-w-[1400px] mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8">
                        {formData.id ? 'Ubah' : 'Tambah'} Data Kegiatan
                    </h1>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={handleFormSubmit} id="main">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="flex flex-col">
                                        <label htmlFor="kegiatan" className="mb-2 text-sm font-semibold text-slate-700">Nama Kegiatan</label>
                                        <input 
                                            type="text" 
                                            id="kegiatan" 
                                            className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full" 
                                            value={formData.kegiatan}
                                            onChange={(e) => setFormData({...formData, kegiatan: e.target.value})}
                                            required 
                                            autoFocus 
                                            placeholder="Cth: 2026 DK Pengawasan Iklan..."
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="mak" className="mb-2 text-sm font-semibold text-slate-700">Kode MAK</label>
                                        <input 
                                            type="text" 
                                            id="mak" 
                                            className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full" 
                                            value={formData.mak}
                                            onChange={(e) => setFormData({...formData, mak: e.target.value})}
                                            required 
                                            placeholder="Cth: 3165.QIC.004..."
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col mb-8">
                                    <label htmlFor="maksud_tugas" className="mb-2 text-sm font-semibold text-slate-700">Maksud Tugas</label>
                                    <textarea 
                                        id="maksud_tugas" 
                                        rows={4} 
                                        className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full resize-none"
                                        value={formData.maksud_tugas}
                                        onChange={(e) => setFormData({...formData, maksud_tugas: e.target.value})}
                                        required
                                        placeholder="Tuliskan maksud dari tugas secara rinci..."
                                    ></textarea>
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
                                        {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Simpan Data"}
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Data Kegiatan</h1>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={handleOpenAdd}
                            className="bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Tambah Kegiatan
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mb-8">
                    
                    {/* Toolbar Search & Filter */}
                    <div className="p-4 border-b border-slate-100 bg-white flex flex-col xl:flex-row gap-4 justify-between items-center">
                        <form onSubmit={handleSearchSubmit} className="flex items-center w-full xl:w-auto flex-1 max-w-2xl bg-[#f4f6f8] rounded-xl px-4 py-2.5 transition-all">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                            <input 
                                type="text" 
                                placeholder="Cari kegiatan berdasarkan nama"
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

                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white border-b border-slate-100 text-slate-800 font-bold text-[11px] uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-5 text-center w-16">No</th>
                                    <th className="px-6 py-5">Nama Kegiatan</th>
                                    <th className="px-6 py-5">Kode MAK</th>
                                    <th className="px-6 py-5">Maksud Tugas</th>
                                    <th className="px-6 py-5 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <span className="loading loading-spinner loading-lg text-teal-600"></span>
                                            <p className="mt-3 text-sm font-medium">Memuat data kegiatan...</p>
                                        </td>
                                    </tr>
                                ) : kegiatan.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
                                                <p className="text-sm font-medium">Data kegiatan tidak ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    kegiatan.map((item: any, index: number) => {
                                        const isDK = item.kegiatan?.toUpperCase().includes('DK');
                                        const isLK = item.kegiatan?.toUpperCase().includes('LK');
                                        const subtitle = isDK ? 'Operasional Pengawasan Dalam Kota' : isLK ? 'Pengawasan Wilayah Luar Kota' : 'Tugas Fungsi BBPOM';

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-5 text-center font-medium text-slate-500">{getStartingNumber() + index}</td>
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-slate-800 uppercase max-w-[300px] truncate" title={item.kegiatan}>
                                                        {item.kegiatan}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="inline-flex items-center gap-1.5 bg-[#eef2f6] text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                                        {item.mak || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-slate-600 max-w-[200px] truncate" title={item.maksud_tugas || '-'}>
                                                        {item.maksud_tugas || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex justify-center items-center gap-3">
                                                        <button 
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="text-slate-500 hover:text-blue-600 transition-colors"
                                                            title="Edit Kegiatan"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">edit_square</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-slate-500 hover:text-red-600 transition-colors"
                                                            title="Hapus Kegiatan"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </div>
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
                            Menampilkan <span className="font-bold text-slate-800">{kegiatan.length > 0 ? currentTampilDari : 0}</span> s/d <span className="font-bold text-slate-800">{kegiatan.length > 0 ? currentTampilSampai : 0}</span> dari <span className="font-bold text-slate-800">{totalData}</span> kegiatan terdaftar
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