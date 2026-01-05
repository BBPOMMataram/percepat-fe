"use client";

import api from "@/utils/api";
import { useState } from "react";
import LoadingWithoutText from "../admin/layouts/LoadingWithoutText";

interface FormSukuCadangProps {
    listBarang: any[];
    setListBarang: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function FormSukuCadang({ listBarang, setListBarang }: FormSukuCadangProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sukuCadangList, setSukuCadangList] = useState<any[]>([]);
    const [selectedSukuCadang, setSelectedSukuCadang] = useState<any>(null);
    const [jumlah, setJumlah] = useState<number>(1);
    const [keterangan, setKeterangan] = useState<string>("");

    const fetchSukuCadang = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/barang-suku-cadang/getAll?name=${searchTerm}`);
            setSukuCadangList(res.data || []);
        } catch (error) {
            console.error("Error fetching Suku Cadang:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.length === 0) {
            setSukuCadangList([]);
        } else {
            fetchSukuCadang();
        }
    };

    const handleAddBarang = () => {
        if (!selectedSukuCadang) {
            alert("Silakan pilih Suku Cadang terlebih dahulu");
            return;
        }
        if (jumlah < 1) {
            alert("Jumlah harus minimal 1");
            return;
        }

        const newItem = {
            id: selectedSukuCadang.id,
            nama: selectedSukuCadang.nama,
            kode: selectedSukuCadang.kode || "",
            nup: selectedSukuCadang.nup || "",
            satuan: selectedSukuCadang.satuan,
            jumlah,
            keterangan,
            jenis: "sukuCadang"
        };

        setListBarang([...listBarang, newItem]);
        setSelectedSukuCadang(null);
        setJumlah(1);
        setKeterangan("");
    };

    const handleRemoveBarang = (index: number) => {
        const newList = [...listBarang];
        newList.splice(index, 1);
        setListBarang(newList);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-4">Form Suku Cadang</h3>

                {/* Search and Select Suku Cadang */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cari Suku Cadang
                    </label>
                    <input
                        type="text"
                        className="ar-input-text-purple w-full"
                        placeholder="Cari berdasarkan nama..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>

                {isLoading ? (
                    <LoadingWithoutText />
                ) : (
                    <div className="max-h-48 overflow-y-auto border rounded">
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
                                {sukuCadangList.map((item: any) => (
                                    <tr key={item.id} className="border-t hover:bg-gray-50">
                                        <td className="p-2 text-sm">{item.nama}</td>
                                        <td className="p-2 text-sm">{item.satuan}</td>
                                        <td className="p-2 text-sm">{item.stock}</td>
                                        <td className="p-2 text-sm">
                                            <button
                                                onClick={() => setSelectedSukuCadang(item)}
                                                className={`px-3 py-1 rounded text-sm ${selectedSukuCadang?.id === item.id
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                                    }`}
                                            >
                                                {selectedSukuCadang?.id === item.id ? 'Dipilih' : 'Pilih'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Selected Suku Cadang Details */}
                {selectedSukuCadang && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-medium">Suku Cadang Dipilih: {selectedSukuCadang.nama}</p>
                        <p className="text-sm text-gray-600">Satuan: {selectedSukuCadang.satuan}</p>
                    </div>
                )}

                {/* Quantity and Add Button */}
                <div className="mt-4 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={jumlah}
                            onChange={(e) => setJumlah(parseInt(e.target.value) || 1)}
                            className="ar-input-text-purple w-full"
                        />
                    </div>
                    <button
                        onClick={handleAddBarang}
                        disabled={!selectedSukuCadang}
                        className={`px-4 py-2 rounded ${selectedSukuCadang
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
                    <h3 className="text-lg font-semibold mb-4">Daftar Suku Cadang yang Diajukan</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left text-sm">No</th>
                                    <th className="p-2 text-left text-sm">Nama</th>
                                    <th className="p-2 text-left text-sm">Jumlah</th>
                                    <th className="p-2 text-left text-sm">Satuan</th>
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

