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
        let endpoint = url || `http://localhost:8001/api/perjadin?page=${currentPage}&value_per_page=${perPage}&name=${activeSearch}`;

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
        // Ambil list Surat Tugas untuk form tambah (bisa di-limit 1000 agar masuk semua)
        api.get(`http://localhost:8001/api/st?limit=1000`).then(res => setOptSuratTugas(res.data?.data || res.data));
    }, [fetchData]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setActiveSearch(searchInput);
    };

    const handleOpenAdd = () => {
        setEditId(null);
        setSelectedStId("");
        setPetugasList([]);
        setIsLuarDaerah(false);
        setIsFormOpen(true);
    };

    // Saat Surat Tugas dipilih di form, ambil petugasnya dari API backend
    const handleStChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedStId(id);
        
        if (!id) {
            setPetugasList([]);
            return;
        }

        try {
            const res = await api.get(`http://localhost:8001/api/data-petugas/${id}`);
            const dataPetugas = res.data;
            
            // Inisialisasi format form per petugas
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
            api.delete(`http://localhost:8001/api/perjadin/${id}`)
                .then((res) => {
                    toast.success(res.data?.msg || "Data berhasil dihapus");
                    fetchData();
                })
                .catch((err) => toast.error("Gagal menghapus data"));
        }
    };

    const handleDownloadKwitansi = (id: number) => {
        window.open(`http://localhost:8001/api/download-kwitansi/${id}`, "_blank");
    };

    const handleDownloadNominatif = (id: number) => {
        window.open(`http://localhost:8001/api/download-nominatif/${id}`, "_blank");
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

        const request = editId 
            ? api.put(`http://localhost:8001/api/perjadin/${editId}`, payload)
            : api.post(`http://localhost:8001/api/perjadin`, payload);

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

    const formatRp = (value: number | string) => {
        if (!value) return "-";
        return "Rp. " + Number(value).toLocaleString("id-ID");
    };

    if (isFormOpen) {
        return (
            <div className="py-12 w-full min-w-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="bg-secondary text-secondary-content overflow-hidden shadow-sm rounded-lg w-full">
                        <div className="p-8">
                            <h2 className="text-xl uppercase mb-8 font-bold">
                                {editId ? 'Ubah' : 'Tambah'} Data Perjadin
                            </h2>
                            
                            <form onSubmit={handleFormSubmit}>
                                {!editId && (
                                    <div className="mb-6 flex flex-col">
                                        <label className="mb-2 text-sm font-semibold">Surat Tugas</label>
                                        <select 
                                            className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full md:w-1/2"
                                            value={selectedStId}
                                            onChange={handleStChange}
                                            required={!editId}
                                        >
                                            <option value="">-- Pilih Surat Tugas --</option>
                                            {optSuratTugas.map((st: any) => (
                                                <option key={st.id} value={st.id}>
                                                    {st.nomor_surat} (MAK: {st.mak_kegiatan})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {!editId && (
                                    <div className="mb-8 flex items-center gap-3">
                                        <label className="cursor-pointer flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                className="toggle toggle-primary" 
                                                checked={isLuarDaerah} 
                                                onChange={(e) => setIsLuarDaerah(e.target.checked)} 
                                            />
                                            <span className="font-bold text-sm">Mode Luar Daerah</span>
                                        </label>
                                    </div>
                                )}

                                {petugasList.map((p, idx) => (
                                    <fieldset key={idx} className="border-2 border-primary/30 p-4 mb-6 rounded-lg w-full">
                                        <legend className="px-2 font-bold text-primary">{p.nm_petugas}</legend>
                                        
                                        {/* TRANSPORT */}
                                        {isLuarDaerah ? (
                                            <div className="w-full flex flex-col gap-4 mb-4">
                                                <label className="text-sm font-semibold text-primary">Transport Luar Kota</label>
                                                {p.transports_luar.map((tl: any, tIdx: number) => (
                                                    <div key={tIdx} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end bg-base-100/10 p-4 rounded border border-primary/20">
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="text-xs mb-1 opacity-70">Nama Daerah</label>
                                                            <input type="text" className="bg-primary/5 rounded border-b border-primary py-2 px-3 focus:outline-none w-full" value={tl.transport_name} onChange={e => updateTransportLuar(idx, tIdx, "transport_name", e.target.value)} required />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="text-xs mb-1 opacity-70">Nilai (Rp)</label>
                                                            <input type="number" className="bg-primary/5 rounded border-b border-primary py-2 px-3 focus:outline-none w-full" value={tl.transport_nilai} onChange={e => updateTransportLuar(idx, tIdx, "transport_nilai", e.target.value)} required />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="text-xs mb-1 opacity-70">Lokasi Awal</label>
                                                            <input type="text" className="bg-primary/5 rounded border-b border-primary py-2 px-3 focus:outline-none w-full" value={tl.lokasi_awal} onChange={e => updateTransportLuar(idx, tIdx, "lokasi_awal", e.target.value)} required />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="text-xs mb-1 opacity-70">Lokasi Tujuan</label>
                                                            <input type="text" className="bg-primary/5 rounded border-b border-primary py-2 px-3 focus:outline-none w-full" value={tl.lokasi_tujuan} onChange={e => updateTransportLuar(idx, tIdx, "lokasi_tujuan", e.target.value)} required />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <label className="text-xs mb-1 opacity-70">Kendaraan</label>
                                                            <div className="flex gap-2 w-full">
                                                                <select className="bg-primary/5 rounded border-b border-primary py-2 px-3 focus:outline-none w-full" value={tl.transport_ket_luar} onChange={e => updateTransportLuar(idx, tIdx, "transport_ket_luar", e.target.value)}>
                                                                    <option value="">-- Pilih --</option>
                                                                    <option value="Kendaraan Dinas">Kendaraan Dinas</option>
                                                                    <option value="Kendaraan Umum">Kendaraan Umum</option>
                                                                    <option value="Kendaraan Dinas dan Umum">Kendaraan Dinas dan Umum</option>
                                                                </select>
                                                                {p.transports_luar.length > 1 && (
                                                                    <button type="button" onClick={() => removeTransportLuarRow(idx, tIdx)} className="btn btn-error btn-sm h-full rounded shrink-0 px-2"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addTransportLuarRow(idx)} className="btn btn-primary btn-sm w-fit">Tambah Lokasi</button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                <div className="flex flex-col min-w-0">
                                                    <label className="mb-2 text-sm opacity-80">Nilai Transport (Rp)</label>
                                                    <input type="number" className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full" value={p.transport} onChange={e => updateField(idx, "transport", e.target.value)} required />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <label className="mb-2 text-sm opacity-80">Kendaraan</label>
                                                    <select className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full" value={p.transport_ket} onChange={e => updateField(idx, "transport_ket", e.target.value)}>
                                                        <option value="">-- Pilih Kendaraan --</option>
                                                        <option value="Kendaraan Dinas">Kendaraan Dinas</option>
                                                        <option value="Kendaraan Umum">Kendaraan Umum</option>
                                                        <option value="Kendaraan Dinas dan Umum">Kendaraan Dinas dan Umum</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {/* UH & PENGINAPAN */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4 mt-6">
                                            <div className="flex flex-col min-w-0">
                                                <label className="mb-2 text-sm opacity-80">Uang Harian (UH)</label>
                                                <input type="number" className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full" value={p.uh} onChange={e => updateField(idx, "uh", e.target.value)} required />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <label className="mb-2 text-sm opacity-80">Keterangan UH</label>
                                                <input type="text" className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full" value={p.uh_ket} onChange={e => updateField(idx, "uh_ket", e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-2">
                                            <div className="flex flex-col min-w-0">
                                                <label className="mb-2 text-sm opacity-80">Penginapan</label>
                                                <input type="number" className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full" value={p.penginapan} onChange={e => updateField(idx, "penginapan", e.target.value)} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <label className="mb-2 text-sm opacity-80">Keterangan Penginapan</label>
                                                <input type="text" className="bg-primary/5 rounded border-transparent border-b border-b-primary focus:outline-none py-2 px-3 text-secondary-content w-full" value={p.penginapan_ket} onChange={e => updateField(idx, "penginapan_ket", e.target.value)} />
                                            </div>
                                        </div>
                                    </fieldset>
                                ))}

                                <div className="grid grid-cols-2 gap-4 max-w-[280px] mt-8">
                                    <button type="button" onClick={() => setIsFormOpen(false)} className="py-2.5 px-4 bg-gray-500 hover:bg-gray-600 text-gray-50 text-center rounded transition-colors">
                                        Kembali
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="py-2.5 px-4 bg-primary hover:brightness-110 text-primary-content rounded transition-all flex justify-center items-center">
                                        {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Simpan"}
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
        <div className="py-12 w-full min-w-0 overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="p-4 sm:p-6 py-10 bg-secondary text-secondary-content rounded-lg shadow-sm w-full">
                    
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4 w-full">
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

                    <div className="w-full overflow-x-auto mt-4 rounded-lg">
                        <table className="table w-full text-sm whitespace-nowrap mb-2 min-w-max">
                            <thead>
                                <tr className="text-left border-b leading-9 bg-primary text-primary-content border-b-yellow-100 [&>th]:px-4 [&>th]:py-3">
                                    <th className="text-center w-12">No</th>
                                    <th className="text-center px-4">Aksi</th>
                                    <th className="whitespace-nowrap">Tanggal Surat</th>
                                    <th className="whitespace-nowrap">Tanggal Tugas</th>
                                    <th className="whitespace-nowrap">MAK Kegiatan</th>
                                    <th className="whitespace-nowrap">Petugas</th>
                                    <th className="min-w-[200px]">Maksud Tugas</th>
                                    <th className="whitespace-nowrap">Lokasi</th>
                                    <th className="whitespace-nowrap">Nama Daerah</th>
                                    <th className="whitespace-nowrap">Lokasi Awal</th>
                                    <th className="whitespace-nowrap">Lokasi Tujuan</th>
                                    <th className="whitespace-nowrap">Transport</th>
                                    <th className="whitespace-nowrap">UH</th>
                                    <th className="whitespace-nowrap">Penginapan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={14} className="text-center py-8 text-gray-400">
                                            <span className="loading loading-spinner loading-md"></span> Memuat data...
                                        </td>
                                    </tr>
                                ) : perjadinData.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="text-center py-8 text-gray-400">
                                            Data perjadin tidak ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    perjadinData.map((item: any, index: number) => {
                                        const suratTugas = item.list_petugas?.surat_tugas;
                                        
                                        const tglSurat = suratTugas?.tanggal_surat ? dayjs(suratTugas.tanggal_surat).format('DD MMMM YYYY') : '-';
                                        
                                        let tglTugas = '-';
                                        if (suratTugas?.tanggal_dari && suratTugas?.tanggal_sampai) {
                                            const tDari = dayjs(suratTugas.tanggal_dari).format('DD MMMM YYYY');
                                            const tSampai = dayjs(suratTugas.tanggal_sampai).format('DD MMMM YYYY');
                                            tglTugas = tDari === tSampai ? tDari : `${tDari} - ${tSampai}`;
                                        }

                                        const hasTransportLuar = item.transport_luar && item.transport_luar.length > 0;

                                        return (
                                        <tr 
                                            key={item.id} 
                                            className="border-b odd:bg-white/5 odd:text-accent-content hover:bg-primary hover:text-primary-content transition-colors align-top [&>td]:px-4 [&>td]:py-3"
                                        >
                                            <td className="text-center font-medium">{getStartingNumber() + index}</td>
                                            
                                            <td className="w-32">
                                                <div className="flex justify-center items-center gap-2 flex-wrap max-w-[120px]">
                                                    <button onClick={() => handleDelete(item.id)} className="hover:scale-110 transition-transform tooltip tooltip-bottom" data-tip="Hapus">
                                                        <span className="material-symbols-outlined text-red-500 text-[18px]">delete</span>
                                                    </button>
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:scale-110 transition-transform tooltip tooltip-bottom" data-tip="Edit">
                                                        <span className="material-symbols-outlined text-blue-500 text-[18px]">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDownloadKwitansi(item.id)} className="hover:scale-110 transition-transform tooltip tooltip-bottom" data-tip="Kwitansi">
                                                        <span className="material-symbols-outlined text-info text-[18px]">download</span>
                                                    </button>
                                                    <button onClick={() => handleDownloadNominatif(item.id)} className="hover:scale-110 transition-transform tooltip tooltip-bottom" data-tip="Nominatif">
                                                        <span className="material-symbols-outlined text-green-500 text-[18px]">download</span>
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap">{tglSurat}</td>
                                            <td className="whitespace-nowrap">{tglTugas}</td>
                                            <td className="whitespace-nowrap">{suratTugas?.mak_kegiatan || '-'}</td>
                                            <td className="whitespace-nowrap font-semibold">{item.list_petugas?.petugas?.nm_petugas || '-'}</td>
                                            <td className="whitespace-normal min-w-[200px] leading-relaxed">{suratTugas?.maksud_tugas || '-'}</td>
                                            <td className="whitespace-nowrap">{suratTugas?.wilayah_tugas || '-'}</td>
                                            
                                            <td className="whitespace-normal min-w-[120px]">
                                                {hasTransportLuar 
                                                    ? item.transport_luar.map((t:any) => t.transport_name).join(" | ")
                                                    : "-"
                                                }
                                            </td>
                                            <td className="whitespace-normal min-w-[120px]">
                                                {hasTransportLuar 
                                                    ? item.transport_luar.map((t:any) => t.lokasi_awal).join(" | ")
                                                    : "-"
                                                }
                                            </td>
                                            <td className="whitespace-normal min-w-[120px]">
                                                {hasTransportLuar 
                                                    ? item.transport_luar.map((t:any) => t.lokasi_tujuan).join(" | ")
                                                    : "-"
                                                }
                                            </td>

                                            <td className="whitespace-nowrap font-semibold">
                                                {hasTransportLuar 
                                                    ? item.transport_luar.map((t:any, i:number) => <div key={i}>{formatRp(t.transport_nilai)}</div>)
                                                    : formatRp(item.transport)
                                                }
                                            </td>
                                            
                                            <td className="whitespace-nowrap">{formatRp(item.uh)}</td>
                                            <td className="whitespace-nowrap">{formatRp(item.penginapan)}</td>
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