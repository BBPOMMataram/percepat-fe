"use client";

import api from "@/utils/api";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";

export default function MasterPetugas() {
    const [petugas, setPetugas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState("10");
    const [searchBy, setSearchBy] = useState("nama");
    const [searchInput, setSearchInput] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [paginationData, setPaginationData] = useState<any>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isShowOpen, setIsShowOpen] = useState(false);
    const [showData, setShowData] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        nm_petugas: "",
        NIP: "",
        username: "",
        Pangkat: "",
        Jabatan: "",
        ket: "",
        level: "Operator"
    });

    const fetchData = useCallback((url?: string) => {
        setLoading(true);
        // Sesuai ApiPetugasController: query parameters adalah value_per_page dan name
        let endpoint = url || `http://localhost:8001/api/petugas?page=${currentPage}&value_per_page=${perPage}&name=${activeSearch}`;

        api.get(endpoint)
            .then((res) => {
                const responseData = res.data;
                if (Array.isArray(responseData)) {
                    setPetugas(responseData);
                } else if (Array.isArray(responseData?.data)) {
                    setPetugas(responseData.data);
                    setPaginationData(responseData);
                } else if (Array.isArray(responseData?.data?.data)) {
                    setPetugas(responseData.data.data);
                    setPaginationData(responseData.data);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Gagal mengambil data petugas:", err);
                toast.error("Gagal mengambil data petugas");
                setPetugas([]);
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

    const handleOpenAdd = () => {
        setFormData({ id: null, nm_petugas: "", NIP: "", username: "", Pangkat: "", Jabatan: "", ket: "", level: "Operator" });
        setIsShowOpen(false);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item: any) => {
        setFormData({
            id: item.id,
            nm_petugas: item.nm_petugas || "",
            NIP: item.NIP || "",
            username: item.username || "",
            Pangkat: item.Pangkat || "",
            Jabatan: item.Jabatan || "",
            ket: item.ket || "",
            level: item.level || "Operator"
        });
        setIsShowOpen(false);
        setIsFormOpen(true);
    };

    const handleOpenShow = (item: any) => {
        setShowData(item);
        setIsFormOpen(false);
        setIsShowOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
            api.delete(`http://localhost:8001/api/petugas/${id}`)
                .then((res) => {
                    toast.success(res.data?.message || res.data?.msg || "Data berhasil dihapus");
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

        // MAPPING KEY PAYLOAD SESUAI DENGAN APIPETUGASCONTROLLER
        const payload = {
            name: formData.nm_petugas,
            nip: formData.NIP,
            username: formData.username,
            pangkat: formData.Pangkat,
            jabatan: formData.Jabatan,
            ket: formData.ket,
            level: formData.level
        };

        const request = formData.id 
            ? api.put(`http://localhost:8001/api/petugas/${formData.id}`, payload)
            : api.post(`http://localhost:8001/api/petugas`, payload);

        request
            .then((res) => {
                toast.success(res.data?.message || res.data?.msg || "Data berhasil disimpan");
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

    if (isShowOpen && showData) {
        return (
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-secondary text-secondary-content overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8 [&>div]:mb-3">
                            <h2 className="text-2xl uppercase mb-8 font-bold">Data <b>{showData.nm_petugas}</b></h2>
                            <div className="text-lg">Nama : <strong>{showData.nm_petugas}</strong></div>
                            <div className="text-lg">NIP : <strong>{showData.NIP || '-'}</strong></div>
                            <div className="text-lg">Username : <strong>{showData.username}</strong></div>
                            <div className="text-lg">Pangkat : <strong>{showData.Pangkat || '-'}</strong></div>
                            <div className="text-lg">Jabatan : <strong>{showData.Jabatan || '-'}</strong></div>
                            <div className="text-lg">Keterangan : <strong>{showData.ket || '-'}</strong></div>
                            
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
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-secondary text-secondary-content overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-8">
                            <h2 className="text-xl uppercase mb-2 font-bold">
                                {formData.id ? 'Ubah' : 'Tambah'} Data Petugas
                            </h2>
                            {!formData.id}
                            
                            <form onSubmit={handleFormSubmit} id="main">
                                <div className="form-container flex flex-col">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="flex flex-col">
                                            <label htmlFor="nm_petugas" className="mb-2 text-sm">Nama</label>
                                            <input 
                                                type="text" 
                                                id="nm_petugas" 
                                                className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
                                                value={formData.nm_petugas}
                                                onChange={(e) => setFormData({...formData, nm_petugas: e.target.value})}
                                                required 
                                                autoFocus 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="NIP" className="mb-2 text-sm">NIP</label>
                                            <input 
                                                type="text" 
                                                id="NIP" 
                                                className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
                                                value={formData.NIP}
                                                onChange={(e) => setFormData({...formData, NIP: e.target.value})}
                                                required 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="username" className="mb-2 text-sm">Username</label>
                                            <input 
                                                type="text" 
                                                id="username" 
                                                className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
                                                value={formData.username}
                                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                                required 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="Pangkat" className="mb-2 text-sm">Pangkat</label>
                                            <input 
                                                type="text" 
                                                id="Pangkat" 
                                                className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
                                                value={formData.Pangkat}
                                                onChange={(e) => setFormData({...formData, Pangkat: e.target.value})}
                                                required 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="Jabatan" className="mb-2 text-sm">Jabatan</label>
                                            <input 
                                                type="text" 
                                                id="Jabatan" 
                                                className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary focus:outline-none py-2 px-3 text-secondary-content" 
                                                value={formData.Jabatan}
                                                onChange={(e) => setFormData({...formData, Jabatan: e.target.value})}
                                                required 
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="ket" className="font-semibold mb-2 text-sm">Keterangan</label>
                                            <textarea 
                                                id="ket" 
                                                rows={2} 
                                                className="bg-primary/5 rounded w-full border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary focus:outline-none py-2 px-3 text-secondary-content resize-none"
                                                value={formData.ket}
                                                onChange={(e) => setFormData({...formData, ket: e.target.value})}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 max-w-[280px] mt-8">
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
        <div className="py-12">
            <div className="sm:mx-6 lg:mx-8 p-6 py-10 bg-secondary text-secondary-content rounded overflow-x-auto shadow-sm">
                
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <button 
                        onClick={handleOpenAdd}
                        className="bg-primary text-primary-content rounded px-4 py-2 inline-block hover:brightness-110 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px] translate-y-1">add</span>
                    </button>

                    <span className="ml-auto mb-3">
                        <form onSubmit={handleSearchSubmit} className="flex [&_option]:bg-secondary items-center gap-2 flex-wrap">
                            <div className="tooltip" data-tip="Data per halaman">
                                <select 
                                    className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary text-secondary-content py-2 px-3 outline-none" 
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
                                    className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:ring-transparent focus:border-transparent focus:border-b-primary text-secondary-content py-2 px-3 outline-none" 
                                    value={searchBy}
                                    onChange={(e) => {
                                        setSearchBy(e.target.value);
                                        setSearchInput("");
                                    }}
                                >
                                    <option value="nama">Nama</option>
                                </select>
                            </div>
                            <div className="inline-flex items-center bg-primary/5 rounded border-transparent border-b border-b-primary focus-within:border-b-primary px-3 py-1">
                                <input 
                                    type="text" 
                                    placeholder={`Cari berdasarkan ${searchBy}`}
                                    className="border-transparent focus:outline-none focus:ring-0 focus:border-transparent bg-transparent text-secondary-content w-full max-w-[200px]"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                <button 
                                    type="submit" 
                                    className="bg-primary/70 hover:bg-primary border border-primary py-1 px-2 rounded-full cursor-pointer hover:scale-105 text-primary-content transition-all ml-2 flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[16px]">search</span>
                                </button>
                            </div>
                        </form>
                    </span>
                </div>

                <table className="w-full mb-4 rounded table">
                    <thead>
                        <tr className="text-left border-b leading-9 bg-primary text-primary-content border-b-yellow-100 [&>th]:p-3 text-sm">
                            <th className="text-center w-16">No</th>
                            <th>Nama</th>
                            <th>NIP</th>
                            <th>Username</th>
                            <th>Pangkat</th>
                            <th>Jabatan</th>
                            <th>Ket</th>
                            <th className="text-center w-36">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-400">
                                    <span className="loading loading-spinner loading-md"></span> Memuat data...
                                </td>
                            </tr>
                        ) : petugas.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-400">
                                    Data petugas tidak ditemukan.
                                </td>
                            </tr>
                        ) : (
                            petugas.map((item: any, index: number) => (
                                <tr 
                                    key={item.id} 
                                    className="border-b odd:bg-white/5 odd:text-accent-content [&>td]:p-3 hover:bg-primary hover:text-primary-content transition-colors"
                                >
                                    <td className="text-center font-medium">{getStartingNumber() + index}</td>
                                    <td className="font-semibold">{item.nm_petugas}</td>
                                    <td>{item.NIP || '-'}</td>
                                    <td>{item.username}</td>
                                    <td>{item.Pangkat || '-'}</td>
                                    <td>{item.Jabatan || '-'}</td>
                                    <td>{item.ket || '-'}</td>
                                    <td className="flex justify-center gap-2">
                                        <div className="tooltip" data-tip="Lihat">
                                            <button 
                                                onClick={() => handleOpenShow(item)}
                                                className="mx-1 hover:scale-110 transition-transform"
                                            >
                                                <span className="material-symbols-outlined text-teal-600 text-[20px]">visibility</span>
                                            </button>
                                        </div>
                                        <div className="tooltip" data-tip="Edit">
                                            <button 
                                                onClick={() => handleOpenEdit(item)}
                                                className="mx-1 hover:scale-110 transition-transform"
                                            >
                                                <span className="material-symbols-outlined text-blue-500 text-[20px]">edit</span>
                                            </button>
                                        </div>
                                        <div className="tooltip" data-tip="Delete">
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="mx-1 hover:scale-110 transition-transform"
                                            >
                                                <span className="material-symbols-outlined text-red-500 text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {(paginationData?.meta?.links || paginationData?.links) && (paginationData?.meta?.last_page > 1 || paginationData?.last_page > 1) && (
                    <div className="[&_p]:!text-secondary-content [&_.bg-white]:bg-primary [&_.bg-white]:text-primary-content mt-10">
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
    );
}