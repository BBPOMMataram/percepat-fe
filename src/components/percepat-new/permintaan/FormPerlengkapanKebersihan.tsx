"use client";

import LoadingWithoutText from "@/components/percepat/admin/layouts/LoadingWithoutText";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

interface FormPerlengkapanKebersihanProps {
    listBarang: any[];
    setListBarang: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function FormPerlengkapanKebersihan({ listBarang, setListBarang }: FormPerlengkapanKebersihanProps) {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dispatch = useDispatch<AppDispatch>();
    const [searchTerm, setSearchTerm] = useState("");
    const [barangList, setBarangList] = useState<any[]>([]);
    const [selectedBarang, setSelectedBarang] = useState<any>(null);
    const [jumlah, setJumlah] = useState<number>(1);
    const [keterangan, setKeterangan] = useState<string>("");

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const fetchReagen = async (query: string) => {
        setIsLoading(true);
        try {
            const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-perlengkapan-kebersihan-all?name=${query}`);
            setBarangList(res.data || []);
            console.log(res.data);

        } catch (error) {
            console.error("Error fetching barang:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length === 0) {
            setBarangList([]);
        } else {
            // Debounce: wait 1000ms before fetching
            searchTimeoutRef.current = setTimeout(() => {
                fetchReagen(value);
            }, 1000);
        }
    };

    const handleAddBarang = () => {
        if (!selectedBarang) {
            dispatch(showAlert({ type: "error", message: "Silakan pilih barang terlebih dahulu", description: "Silakan pilih barang terlebih dahulu" }));
            return;
        }
        if (jumlah < 1) {
            dispatch(showAlert({ type: "error", message: "Jumlah harus minimal 1", description: "Jumlah harus minimal 1" }));
            return;
        }
        if (jumlah > selectedBarang.stock) {
            dispatch(showAlert({ type: "error", message: `Jumlah tidak boleh melebihi stok tersedia (${selectedBarang.stock})`, description: `Jumlah tidak boleh melebihi stok tersedia (${selectedBarang.stock})` }));
            return;
        }

        // Check if item already exists in list
        const existingIndex = listBarang.findIndex((item: any) => item.id === selectedBarang.id);

        if (existingIndex >= 0) {
            // Item exists - update quantity
            const updatedList = [...listBarang];
            const newQuantity = updatedList[existingIndex].jumlah + jumlah;

            // Check total doesn't exceed stock
            if (newQuantity > selectedBarang.stock) {
                dispatch(showAlert({ type: "error", message: `Total quantity (${newQuantity}) tidak boleh melebihi stok tersedia (${selectedBarang.stock})`, description: `Total quantity (${newQuantity}) tidak boleh melebihi stok tersedia (${selectedBarang.stock})` }));
                return;
            }

            updatedList[existingIndex].jumlah = newQuantity;
            updatedList[existingIndex].keterangan = keterangan || updatedList[existingIndex].keterangan;
            setListBarang(updatedList);
        } else {
            // Item doesn't exist - add new
            const newItem = {
                id: selectedBarang.id,
                nama: selectedBarang.name,
                satuan: selectedBarang.satuan,
                expired: selectedBarang.expired,
                jumlah,
                keterangan,
                jenis: "barang"
            };
            setListBarang([...listBarang, newItem]);
        }

        dispatch(showAlert({ type: "success", message: "Berhasil menambahkan barang", description: `Berhasil menambahkan ${selectedBarang.name}` }));

        setSelectedBarang(null);
        setJumlah(1);
        setKeterangan("");
    };

    const handleRemoveBarang = (index: number) => {
        const item = listBarang[index];
        const newList = [...listBarang];
        newList.splice(index, 1);
        setListBarang(newList);
        dispatch(showAlert({ type: "success", message: "Berhasil menghapus barang", description: `Berhasil menghapus ${item.nama}` }));
    };

    const isOutOfStock = (item: any) => {
        return !item.stock || item.stock <= 0;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-4">Form Perlengkapan Kebersihan</h3>

                {/* Search and Select Barang */}
                <div className="mb-4">
                    {/* <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cari
                    </label> */}
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="ar-input-text-purple w-full"
                        placeholder="Cari perlengkapan kebersihan berdasarkan nama..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                {isLoading ? (
                    <LoadingWithoutText />
                ) : (
                    <div className="max-h-60 overflow-y-auto border rounded">
                        <table className="w-full">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="p-2 text-left text-sm">Nama</th>
                                    <th className="p-2 text-left text-sm">Satuan</th>
                                    <th className="p-2 text-left text-sm">Stok</th>
                                    <th className="p-2 text-left text-sm">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    (barangList.length === 0 && searchTerm !== '') && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-sm text-gray-500">
                                                Tidak ada barang ditemukan.
                                            </td>
                                        </tr>
                                    )
                                }
                                {
                                    barangList.map((item: any) => (
                                        <tr key={item.id} className={`border-t ${isOutOfStock(item) ? 'bg-red-200' : ''}`}>
                                            <td className="p-2 text-sm">{item.name}</td>
                                            <td className="p-2 text-sm">{item.satuan}</td>
                                            <td className="p-2 text-sm">{item.stock}</td>
                                            <td className="p-2 text-sm">
                                                <button
                                                    onClick={() => setSelectedBarang(item)}
                                                    disabled={isOutOfStock(item)}
                                                    className={`px-3 py-1 rounded text-sm ${selectedBarang?.id === item.id
                                                        ? 'bg-green-500 text-white'
                                                        : isOutOfStock(item)
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                        }`}
                                                >
                                                    {selectedBarang?.id === item.id ? 'Dipilih' : (isOutOfStock(item) ? 'Habis' : 'Pilih')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Selected Barang Details */}
                {selectedBarang && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-medium">Barang Dipilih: {selectedBarang.name}</p>
                        <p className="text-sm text-gray-600">Satuan: {selectedBarang.satuan}</p>
                        <p className="text-sm text-gray-600">Stok Tersedia: {selectedBarang.stock}</p>
                    </div>
                )}

                {/* Quantity and Add Button */}
                <div className="mt-4 flex gap-4 items-end">
                    <div className="">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah {selectedBarang ? `(Max: ${selectedBarang.stock})` : ''}
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={selectedBarang?.stock || 9999}
                            value={jumlah}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                const maxStock = selectedBarang?.stock || 9999;
                                setJumlah(Math.min(val, maxStock));
                            }}
                            className="ar-input-text-purple w-full"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Keterangan
                        </label>
                        <input
                            type="text"
                            value={keterangan}
                            onChange={(e) => {
                                setKeterangan(e.target.value);
                            }}
                            className="ar-input-text-purple w-full"
                        />
                    </div>
                    <button
                        onClick={handleAddBarang}
                        disabled={!selectedBarang}
                        className={`px-4 py-2 rounded ${selectedBarang
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        Tambah
                    </button>
                </div>
            </div>

            {/* List of Added Items */}
            {listBarang.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-lg font-semibold mb-4">Daftar Barang yang Diajukan</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left text-sm">No</th>
                                    <th className="p-2 text-left text-sm">Nama</th>
                                    <th className="p-2 text-left text-sm">Jumlah</th>
                                    <th className="p-2 text-left text-sm">Satuan</th>
                                    <th className="p-2 text-left text-sm">Expired</th>
                                    <th className="p-2 text-left text-sm">Keterangan</th>
                                    <th className="p-2 text-left text-sm">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listBarang.map((item, index) => (
                                    <tr key={index} className="border-t hover:bg-gray-50">
                                        <td className="p-2 text-sm">{index + 1}</td>
                                        <td className="p-2 text-sm">{item.nama}</td>
                                        <td className="p-2 text-sm">{item.jumlah}</td>
                                        <td className="p-2 text-sm">{item.satuan}</td>
                                        <td className="p-2 text-sm">{item.expired ? dayjs(item.expired).format('DD MMM YYYY') : '-'}</td>
                                        <td className="p-2 text-sm">{item.keterangan || '-'}</td>
                                        <td className="p-2 text-sm">
                                            <button
                                                onClick={() => handleRemoveBarang(index)}
                                                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
