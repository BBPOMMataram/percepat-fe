"use client";

import api from "@/utils/api";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import 'dayjs/locale/id';

dayjs.locale('id');

export default function PerjadinComponent() {
    const [perjadinData, setPerjadinData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState("10");
    const [searchInput, setSearchInput] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [paginationData, setPaginationData] = useState<any>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State Form
    const [optSuratTugas, setOptSuratTugas] = useState<any[]>([]);
    const [selectedStId, setSelectedStId] = useState("");
    const [isLuarDaerah, setIsLuarDaerah] = useState(false);
    
    // Array dinamis untuk list petugas dari ST yang dipilih
    const [petugasList, setPetugasList] = useState<any[]>([]);
    const [editId, setEditId] = useState<number | null>(null);

    const fetchData = useCallback((url?: string) => {
        setLoading(true);
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        let endpoint = url || `${baseURL}/api/perjadin?page=${currentPage}&value_per_page=${perPage}&name=${activeSearch}`;

        api.get(endpoint)
            .then((res) => {
                const responseData = res.data;
                if (Array.isArray(responseData)) {
                    setPerjadinData(responseData);
                } else if (Array.isArray(responseData?.data)) {
                    setPerjadinData(responseData.data);
                    setPaginationData(responseData);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Gagal mengambil data:", err);
                setPerjadinData([]);
                setLoading(false);
            });
    }, [currentPage, perPage, activeSearch]);

    useEffect(() => {
        fetchData();
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        api.get(`${baseURL}/api/st?limit=1000`).then(res => setOptSuratTugas(res.data?.data || res.data));
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
        setEditId(null);
        setSelectedStId("");
        setPetugasList([]);
        setIsLuarDaerah(false);
        setIsFormOpen(true);
    };

    const handleStChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedStId(id);
        
        if (!id) {
            setPetugasList([]);
            return;
        }

        try {
            const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
            const res = await api.get(`${baseURL}/api/data-petugas/${id}`);
            const dataPetugas = res.data;
            
            const formatted = dataPetugas.map((lp: any) => ({
                id_list_petugas: lp.id,
                nm_petugas: lp.petugas?.nm_petugas,
                uh: "",
                uh_ket: "",
                penginapan: "",
                penginapan_ket: "",
                transport: "",
                transport_ket: "",
                transports_luar: [{ transport_name: "", transport_nilai: "", lokasi_awal: "", lokasi_tujuan: "", transport_ket_luar: "" }]
            }));
            setPetugasList(formatted);
        } catch (error) {
            console.error(error);
            toast.error("Gagal mengambil data petugas ST");
        }
    };

    const handleOpenEdit = (item: any) => {
        setEditId(item.id);
        const hasLuar = item.transport_luar && item.transport_luar.length > 0;
        setIsLuarDaerah(hasLuar);

        const lp = item.list_petugas;
        setPetugasList([{
            id_list_petugas: lp?.id,
            nm_petugas: lp?.petugas?.nm_petugas,
            uh: item.uh || "",
            uh_ket: item.uh_ket || "",
            penginapan: item.penginapan || "",
            penginapan_ket: item.penginapan_ket || "",
            transport: item.transport || "",
            transport_ket: item.transport_ket || "",
            transports_luar: hasLuar ? item.transport_luar : [{ transport_name: "", transport_nilai: "", lokasi_awal: "", lokasi_tujuan: "", transport_ket_luar: "" }]
        }]);

        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus item ini?")) {
            const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
            api.delete(`${baseURL}/api/perjadin/${id}`)
                .then((res) => {
                    toast.success(res.data?.msg || "Data berhasil dihapus");
                    fetchData();
                })
                .catch((err) => toast.error("Gagal menghapus data"));
        }
    };

    const handleDownloadKwitansi = (id: number) => {
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        window.open(`${baseURL}/api/download-kwitansi/${id}`, "_blank");
    };

    const handleDownloadNominatif = (id: number) => {
        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        window.open(`${baseURL}/api/download-nominatif/${id}`, "_blank");
    };

    const updateField = (idx: number, field: string, value: any) => {
        const arr = [...petugasList];
        arr[idx][field] = value;
        setPetugasList(arr);
    };

    const updateTransportLuar = (petugasIdx: number, transIdx: number, field: string, value: any) => {
        const arr = [...petugasList];
        arr[petugasIdx].transports_luar[transIdx][field] = value;
        setPetugasList(arr);
    };

    const addTransportLuarRow = (petugasIdx: number) => {
        const arr = [...petugasList];
        arr[petugasIdx].transports_luar.push({ transport_name: "", transport_nilai: "", lokasi_awal: "", lokasi_tujuan: "", transport_ket_luar: "" });
        setPetugasList(arr);
    };

    const removeTransportLuarRow = (petugasIdx: number, transIdx: number) => {
        const arr = [...petugasList];
        arr[petugasIdx].transports_luar.splice(transIdx, 1);
        setPetugasList(arr);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (petugasList.length === 0) {
            toast.error("Tidak ada petugas yang dipilih!");
            return;
        }

        setIsSubmitting(true);

        const payload: any = {
            id_list_petugas: petugasList.map(p => p.id_list_petugas),
            uh: petugasList.map(p => p.uh),
            uh_ket: petugasList.map(p => p.uh_ket),
            penginapan: petugasList.map(p => p.penginapan),
            penginapan_ket: petugasList.map(p => p.penginapan_ket),
            transport: petugasList.map(p => p.transport),
            transport_ket: petugasList.map(p => p.transport_ket),
        };

        if (isLuarDaerah) {
            const names: string[] = [];
            const nilais: string[] = [];
            const awals: string[] = [];
            const tujuans: string[] = [];
            const kets: string[] = [];

            petugasList.forEach((p) => {
                p.transports_luar.forEach((tl: any) => {
                    if (tl.transport_name) {
                        names.push(tl.transport_name);
                        nilais.push(tl.transport_nilai);
                        awals.push(tl.lokasi_awal);
                        tujuans.push(tl.lokasi_tujuan);
                        kets.push(tl.transport_ket_luar);
                    }
                });
            });

            payload.transport_name = names;
            payload.transport_nilai = nilais;
            payload.lokasi_awal = awals;
            payload.lokasi_tujuan = tujuans;
            payload.transport_ket_luar = kets;
        }

        const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA || 'http://localhost:8001';
        const request = editId 
            ? api.put(`${baseURL}/api/perjadin/${editId}`, payload)
            : api.post(`${baseURL}/api/perjadin`, payload);

        request
            .then((res) => {
                toast.success(res.data?.msg || "Data berhasil disimpan");
                setIsFormOpen(false);
                fetchData();
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || "Gagal menyimpan data");
            })
            .finally(() => setIsSubmitting(false));
    };

    const getStartingNumber = () => {
        if (!paginationData?.meta?.current_page && !paginationData?.current_page) return 1;
        const page = paginationData?.meta?.current_page || paginationData?.current_page;
        return (page - 1) * parseInt(perPage) + 1;
    };

    const formatRp = (value: number | string | null | undefined) => {
        if (!value) return "-";
        return "Rp. " + Number(value).toLocaleString("id-ID");
    };

    const totalData = paginationData?.meta?.total || paginationData?.total || perjadinData.length;
    const currentTampilDari = getStartingNumber();
    const currentTampilSampai = currentTampilDari + perjadinData.length - 1;
    const isPaginationValid = (paginationData?.meta?.links || paginationData?.links) && (paginationData?.meta?.last_page > 1 || paginationData?.last_page > 1);

    if (isFormOpen) {
        return (
            <div className="py-8 px-4 sm:px-8 w-full max-w-full overflow-hidden">
                <div className="max-w-[1400px] mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8">
                        {editId ? 'Ubah' : 'Tambah'} Rincian Perjalanan Dinas
                    </h1>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={handleFormSubmit} id="main">
                                
                                {!editId && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-100">
                                        <div className="flex flex-col">
                                            <label className="mb-2 text-sm font-semibold text-slate-700">Pilih Surat Tugas</label>
                                            {/* PENGAMAN NULL: || "" */}
                                            <select 
                                                className="bg-slate-50 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-3 px-4 text-slate-700 w-full"
                                                value={selectedStId || ""}
                                                onChange={handleStChange}
                                                required={!editId}
                                            >
                                                <option value="">-- Cari Surat Tugas --</option>
                                                {optSuratTugas.map((st: any) => (
                                                    <option key={st.id} value={st.id}>
                                                        {st.nomor_surat} (MAK: {st.mak_kegiatan})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {!editId && (
                                    <div className="mb-8 flex items-center justify-between bg-teal-50 border border-teal-100 p-4 rounded-xl">
                                        <div>
                                            <h3 className="font-bold text-teal-800">Mode Penugasan Luar Daerah</h3>
                                            <p className="text-xs text-teal-600 mt-0.5">Aktifkan ini jika perjalanan dinas menggunakan lebih dari satu moda transportasi.</p>
                                        </div>
                                        <label className="cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="toggle toggle-success" 
                                                checked={isLuarDaerah} 
                                                onChange={(e) => setIsLuarDaerah(e.target.checked)} 
                                            />
                                        </label>
                                    </div>
                                )}

                                {petugasList.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4">Rincian Pembiayaan Petugas</h3>
                                        <div className="space-y-6">
                                            {petugasList.map((p, idx) => (
                                                <fieldset key={idx} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl w-full relative pt-8">
                                                    <h4 className="absolute -top-3 left-4 bg-white border border-slate-200 px-4 py-1.5 rounded-lg font-bold text-teal-700 text-sm shadow-sm flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px]">person</span>
                                                        {p.nm_petugas}
                                                    </h4>
                                                    
                                                    {/* TRANSPORT */}
                                                    {isLuarDaerah ? (
                                                        <div className="w-full flex flex-col gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-100">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <label className="text-sm font-bold text-slate-700">Rute Transportasi Luar Kota</label>
                                                                <button type="button" onClick={() => addTransportLuarRow(idx)} className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                                                                    + Tambah Rute
                                                                </button>
                                                            </div>
                                                            {p.transports_luar.map((tl: any, tIdx: number) => (
                                                                <div key={tIdx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-200 relative group">
                                                                    <div className="flex flex-col min-w-0">
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1">Daerah</label>
                                                                        <input type="text" className="bg-white rounded-lg border border-slate-200 py-2 px-3 focus:outline-none w-full text-sm" placeholder="Cth: Bali" value={tl.transport_name || ""} onChange={e => updateTransportLuar(idx, tIdx, "transport_name", e.target.value)} required />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1">Nilai (Rp)</label>
                                                                        <input type="number" className="bg-white rounded-lg border border-slate-200 py-2 px-3 focus:outline-none w-full text-sm" placeholder="0" value={tl.transport_nilai || ""} onChange={e => updateTransportLuar(idx, tIdx, "transport_nilai", e.target.value)} required />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1">Lok. Awal</label>
                                                                        <input type="text" className="bg-white rounded-lg border border-slate-200 py-2 px-3 focus:outline-none w-full text-sm" placeholder="Bandara Bizam" value={tl.lokasi_awal || ""} onChange={e => updateTransportLuar(idx, tIdx, "lokasi_awal", e.target.value)} required />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1">Lok. Tujuan</label>
                                                                        <input type="text" className="bg-white rounded-lg border border-slate-200 py-2 px-3 focus:outline-none w-full text-sm" placeholder="Hotel ABC" value={tl.lokasi_tujuan || ""} onChange={e => updateTransportLuar(idx, tIdx, "lokasi_tujuan", e.target.value)} required />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0 relative">
                                                                        <label className="text-[11px] font-bold text-slate-500 uppercase mb-1">Kendaraan</label>
                                                                        <div className="flex gap-2 w-full">
                                                                            {/* PENGAMAN NULL: || "" */}
                                                                            <select className="bg-white rounded-lg border border-slate-200 py-2 px-3 focus:outline-none w-full text-sm truncate" value={tl.transport_ket_luar || ""} onChange={e => updateTransportLuar(idx, tIdx, "transport_ket_luar", e.target.value)}>
                                                                                <option value="">-- Pilih --</option>
                                                                                <option value="Kendaraan Dinas">Kendaraan Dinas</option>
                                                                                <option value="Kendaraan Umum">Kendaraan Umum</option>
                                                                                <option value="Kendaraan Dinas dan Umum">K. Dinas & Umum</option>
                                                                            </select>
                                                                            {p.transports_luar.length > 1 && (
                                                                                <button type="button" onClick={() => removeTransportLuarRow(idx, tIdx)} className="bg-red-50 text-red-500 hover:bg-red-100 rounded-lg px-2 flex items-center justify-center shrink-0 border border-red-100 transition-colors">
                                                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                            <div className="flex flex-col min-w-0">
                                                                <label className="mb-2 text-xs font-bold text-slate-500 uppercase">Nilai Transport (Rp)</label>
                                                                <input type="number" className="bg-white rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-2.5 px-4 text-slate-700 w-full" value={p.transport || ""} onChange={e => updateField(idx, "transport", e.target.value)} required />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <label className="mb-2 text-xs font-bold text-slate-500 uppercase">Jenis Kendaraan</label>
                                                                {/* PENGAMAN NULL: || "" */}
                                                                <select className="bg-white rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-2.5 px-4 text-slate-700 w-full" value={p.transport_ket || ""} onChange={e => updateField(idx, "transport_ket", e.target.value)}>
                                                                    <option value="">-- Pilih Kendaraan --</option>
                                                                    <option value="Kendaraan Dinas">Kendaraan Dinas</option>
                                                                    <option value="Kendaraan Umum">Kendaraan Umum</option>
                                                                    <option value="Kendaraan Dinas dan Umum">Kendaraan Dinas dan Umum</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* UH & PENGINAPAN */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="mb-2 text-xs font-bold text-slate-500 uppercase">Uang Harian (Rp)</label>
                                                            <input type="number" className="bg-white rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-2.5 px-4 text-slate-700 w-full" value={p.uh || ""} onChange={e => updateField(idx, "uh", e.target.value)} required />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="mb-2 text-xs font-bold text-slate-500 uppercase">Keterangan UH</label>
                                                            <input type="text" className="bg-white rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-2.5 px-4 text-slate-700 w-full" value={p.uh_ket || ""} onChange={e => updateField(idx, "uh_ket", e.target.value)} placeholder="Opsional" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="mb-2 text-xs font-bold text-slate-500 uppercase">Nilai Penginapan (Rp)</label>
                                                            <input type="number" className="bg-white rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-2.5 px-4 text-slate-700 w-full" value={p.penginapan || ""} onChange={e => updateField(idx, "penginapan", e.target.value)} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="mb-2 text-xs font-bold text-slate-500 uppercase">Keterangan Penginapan</label>
                                                            <input type="text" className="bg-white rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none py-2.5 px-4 text-slate-700 w-full" value={p.penginapan_ket || ""} onChange={e => updateField(idx, "penginapan_ket", e.target.value)} placeholder="Nama Hotel/Penginapan" />
                                                        </div>
                                                    </div>
                                                </fieldset>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100">
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
                                        {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Simpan Data Perjadin"}
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Manajemen Perjalanan Dinas</h1>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={handleOpenAdd}
                            className="bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Tambah Perjadin
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
                                placeholder="Cari berdasarkan nama kegiatan..."
                                className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full ml-3 text-slate-700 placeholder:text-slate-400"
                                value={searchInput || ""}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <button type="submit" className="hidden">Submit</button>
                        </form>

                        <div className="flex items-center gap-3 w-full xl:w-auto">
                            <div className="flex items-center gap-2 bg-[#f4f6f8] rounded-xl px-4 py-2.5">
                                <span className="text-sm text-slate-500">Baris:</span>
                                {/* PENGAMAN NULL: || "" */}
                                <select 
                                    className="bg-transparent border-none focus:outline-none text-sm font-medium text-slate-700 cursor-pointer pr-2" 
                                    value={perPage || "10"} 
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
                                    <th className="px-6 py-5 text-center w-36">Aksi</th>
                                    <th className="px-6 py-5">Tanggal Surat</th>
                                    <th className="px-6 py-5">Tanggal Tugas</th>
                                    <th className="px-6 py-5">MAK Kegiatan</th>
                                    <th className="px-6 py-5">Petugas</th>
                                    <th className="px-6 py-5">Maksud Tugas</th>
                                    <th className="px-6 py-5">Lokasi (ST)</th>
                                    <th className="px-6 py-5">Nama Daerah</th>
                                    <th className="px-6 py-5">Lokasi Awal</th>
                                    <th className="px-6 py-5">Lokasi Tujuan</th>
                                    <th className="px-6 py-5">Transport</th>
                                    <th className="px-6 py-5">Uang Harian</th>
                                    <th className="px-6 py-5">Penginapan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={14} className="px-6 py-12 text-center text-slate-400">
                                            <span className="loading loading-spinner loading-lg text-teal-600"></span>
                                            <p className="mt-3 text-sm font-medium">Memuat data perjalanan dinas...</p>
                                        </td>
                                    </tr>
                                ) : perjadinData.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
                                                <p className="text-sm font-medium">Data perjalanan dinas tidak ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    perjadinData.map((item: any, index: number) => {
                                        const suratTugas = item.list_petugas?.surat_tugas;
                                        
                                        const tglSurat = suratTugas?.tanggal_surat ? dayjs(suratTugas.tanggal_surat).format('DD MMM YYYY') : '-';
                                        
                                        let tglTugas = '-';
                                        if (suratTugas?.tanggal_dari && suratTugas?.tanggal_sampai) {
                                            const tDari = dayjs(suratTugas.tanggal_dari).format('DD MMM YYYY');
                                            const tSampai = dayjs(suratTugas.tanggal_sampai).format('DD MMM YYYY');
                                            tglTugas = tDari === tSampai ? tDari : `${tDari} - ${tSampai}`;
                                        }

                                        const hasTransportLuar = item.transport_luar && item.transport_luar.length > 0;

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors align-top">
                                                <td className="px-6 py-5 text-center font-medium text-slate-500">{getStartingNumber() + index}</td>
                                                
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex flex-wrap justify-center items-center gap-1.5 min-w-[120px]">
                                                        <button onClick={() => handleDownloadKwitansi(item.id)} className="p-1 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors tooltip tooltip-top" data-tip="Unduh Kwitansi">
                                                            <span className="material-symbols-outlined text-[16px]">download</span>
                                                        </button>
                                                        <button onClick={() => handleDownloadNominatif(item.id)} className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors tooltip tooltip-top" data-tip="Unduh Nominatif">
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
                                                    <div className="text-[11px] text-slate-500 inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                                                        <span className="material-symbols-outlined text-[12px]">edit_calendar</span> 
                                                        {tglSurat}
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5">
                                                    <div className="text-slate-700 font-medium">{tglTugas}</div>
                                                </td>
                                                
                                                <td className="px-6 py-5">
                                                    <div className="inline-flex items-center gap-1.5 bg-[#eef2f6] text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                                        {suratTugas?.mak_kegiatan || '-'}
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5 font-bold text-slate-800">{item.list_petugas?.petugas?.nm_petugas || '-'}</td>
                                                
                                                <td className="px-6 py-5">
                                                    <div className="whitespace-normal min-w-[200px] leading-relaxed text-slate-600" title={suratTugas?.maksud_tugas}>
                                                        {suratTugas?.maksud_tugas || '-'}
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5">
                                                    <div className="text-slate-700 font-medium inline-flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px] text-teal-600">location_on</span>
                                                        {suratTugas?.wilayah_tugas || '-'}
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1 min-w-[120px]">
                                                        {hasTransportLuar 
                                                            ? item.transport_luar.map((t:any, i:number) => <span key={i} className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-xs truncate" title={t.transport_name}>{t.transport_name}</span>)
                                                            : <span className="text-slate-400">-</span>
                                                        }
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1 min-w-[120px]">
                                                        {hasTransportLuar 
                                                            ? item.transport_luar.map((t:any, i:number) => <span key={i} className="text-slate-600 truncate" title={t.lokasi_awal}>{t.lokasi_awal}</span>)
                                                            : <span className="text-slate-400">-</span>
                                                        }
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1 min-w-[120px]">
                                                        {hasTransportLuar 
                                                            ? item.transport_luar.map((t:any, i:number) => <span key={i} className="text-slate-600 truncate" title={t.lokasi_tujuan}>{t.lokasi_tujuan}</span>)
                                                            : <span className="text-slate-400">-</span>
                                                        }
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 font-semibold text-slate-800">
                                                    <div className="flex flex-col gap-1">
                                                        {hasTransportLuar 
                                                            ? item.transport_luar.map((t:any, i:number) => <span key={i}>{formatRp(t.transport_nilai)}</span>)
                                                            : formatRp(item.transport)
                                                        }
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-5 font-semibold text-slate-800">{formatRp(item.uh)}</td>
                                                <td className="px-6 py-5 font-semibold text-slate-800">{formatRp(item.penginapan)}</td>
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
                            Menampilkan <span className="font-bold text-slate-800">{perjadinData.length > 0 ? currentTampilDari : 0}</span> s/d <span className="font-bold text-slate-800">{perjadinData.length > 0 ? currentTampilSampai : 0}</span> dari <span className="font-bold text-slate-800">{totalData}</span> data
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