"use client";

import LoadingWithoutText from "@/components/main/loading/LoadingWithoutText";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";

interface FormBakuPembandingProps {
    listBarang: any[];
    setListBarang: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function FormBakuPembanding({ listBarang, setListBarang }: FormBakuPembandingProps) {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const userFungsi = user?.bidang?.name || user?.employee?.fungsi?.name || (user as any)?.fungsi?.name || "";
    const [searchTerm, setSearchTerm] = useState("");
    const [bakuPembandingList, setBakuPembandingList] = useState<any[]>([]);
    const [selectedBakuPembanding, setSelectedBakuPembanding] = useState<any>(null);
    const [jumlah, setJumlah] = useState<string>("1");
    const [keterangan, setKeterangan] = useState<string>(userFungsi);

    useEffect(() => {
        if (!keterangan && userFungsi) {
            setKeterangan(userFungsi);
        }
    }, [userFungsi]);

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const fetchBakuPembanding = async (query: string) => {
        setIsLoading(true);
        try {
            const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-baku-pembanding-all?name=${query}`);
            setBakuPembandingList(res.data || []);
        } catch (error) {
            console.error("Error fetching baku pembanding:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length === 0) {
            setBakuPembandingList([]);
        } else {
            searchTimeoutRef.current = setTimeout(() => {
                fetchBakuPembanding(value);
            }, 1000);
        }
    };

    const handleAddBarang = () => {
        if (!selectedBakuPembanding) {
            dispatch(showAlert({ type: "error", message: "Silakan pilih baku pembanding terlebih dahulu", description: "Silakan pilih baku pembanding terlebih dahulu" }));
            return;
        }

        const jumlahParsed = parseInt(jumlah) || 0;

        if (jumlahParsed < 1) {
            dispatch(showAlert({ type: "error", message: "Jumlah harus minimal 1", description: "Jumlah harus minimal 1" }));
            return;
        }
        if (jumlahParsed > selectedBakuPembanding.stock) {
            dispatch(showAlert({ type: "error", message: `Jumlah tidak boleh melebihi stok tersedia (${selectedBakuPembanding.stock})`, description: `Jumlah tidak boleh melebihi stok tersedia (${selectedBakuPembanding.stock})` }));
            return;
        }

        const existingIndex = listBarang.findIndex((item: any) => item.id === selectedBakuPembanding.id);

        if (existingIndex >= 0) {
            const updatedList = [...listBarang];
            const newQuantity = updatedList[existingIndex].jumlah + jumlahParsed;

            if (newQuantity > selectedBakuPembanding.stock) {
                dispatch(showAlert({ type: "error", message: `Total quantity (${newQuantity}) tidak boleh melebihi stok tersedia (${selectedBakuPembanding.stock})`, description: `Total quantity (${newQuantity}) tidak boleh melebihi stok tersedia (${selectedBakuPembanding.stock})` }));
                return;
            }

            updatedList[existingIndex].jumlah = newQuantity;
            updatedList[existingIndex].keterangan = keterangan || updatedList[existingIndex].keterangan;
            setListBarang(updatedList);
        } else {
            const newItem = {
                id: selectedBakuPembanding.id,
                kode_baru: selectedBakuPembanding.kode_baru || "",
                nama: selectedBakuPembanding.name,
                letak: selectedBakuPembanding.letak || "",
                satuan: selectedBakuPembanding.satuan,
                expired: selectedBakuPembanding.expired,
                jumlah: jumlahParsed,
                keterangan,
                jenis: "baku_pembanding"
            };
            setListBarang([...listBarang, newItem]);
        }

        dispatch(showAlert({ type: "success", message: "Berhasil menambahkan baku pembanding", description: `Berhasil menambahkan ${selectedBakuPembanding.name}` }));

        setSelectedBakuPembanding(null);
        setJumlah("1");
        setKeterangan(userFungsi);
    };

    const handleRemoveBarang = (index: number) => {
        const item = listBarang[index];
        const newList = [...listBarang];
        newList.splice(index, 1);
        setListBarang(newList);
        dispatch(showAlert({ type: "success", message: "Berhasil menghapus baku pembanding", description: `Berhasil menghapus ${item.nama}` }));
    };

    const isOutOfStock = (item: any) => {
        return !item.stock || item.stock <= 0;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-4">Form Baku Pembanding</h3>

                {/* Search and Select Baku Pembanding */}
                <div className="mb-4">
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="ar-input-text-purple w-full"
                        placeholder="Cari baku pembanding berdasarkan nama atau kode..."
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
                                    <th className="p-2 text-left text-sm">Kode Baru</th>
                                    <th className="p-2 text-left text-sm">Nama</th>
                                    <th className="p-2 text-left text-sm">Letak</th>
                                    <th className="p-2 text-left text-sm">Stok</th>
                                    <th className="p-2 text-left text-sm">Satuan</th>
                                    <th className="p-2 text-left text-sm">Expired</th>
                                    <th className="p-2 text-left text-sm">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bakuPembandingList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-center text-gray-500">
                                            {searchTerm ? "Tidak ada hasil" : "Ketik nama untuk mencari baku pembanding"}
                                        </td>
                                    </tr>
                                ) : (
                                    bakuPembandingList.map((item: any) => (
                                        <tr key={item.id} className={`border-t ${isOutOfStock(item) ? 'bg-red-200' : ''}`}>
                                            <td className="p-2 text-sm">{item.kode_baru || '-'}</td>
                                            <td className="p-2 text-sm">{item.name}</td>
                                            <td className="p-2 text-sm">{item.letak || '-'}</td>
                                            <td className="p-2 text-sm">{item.stock}</td>
                                            <td className="p-2 text-sm">{item.satuan}</td>
                                            <td className="p-2 text-sm">{item.expired ? dayjs(item.expired).format("DD MMM YYYY") : '-'}</td>
                                            <td className="p-2 text-sm">
                                                <button
                                                    onClick={() => setSelectedBakuPembanding(item)}
                                                    disabled={isOutOfStock(item)}
                                                    className={`px-3 py-1 rounded text-sm ${selectedBakuPembanding?.id === item.id
                                                        ? 'bg-green-500 text-white'
                                                        : isOutOfStock(item)
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                        }`}
                                                >
                                                    {selectedBakuPembanding?.id === item.id ? 'Dipilih' : (isOutOfStock(item) ? 'Habis' : 'Pilih')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Selected Baku Pembanding Details */}
                {selectedBakuPembanding && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-medium">Baku Pembanding Dipilih: {selectedBakuPembanding.name}</p>
                        <p className="text-sm text-gray-600">Kode Baru: {selectedBakuPembanding.kode_baru || '-'}</p>
                        <p className="text-sm text-gray-600">Letak: {selectedBakuPembanding.letak || '-'}</p>
                        <p className="text-sm text-gray-600">Stok Tersedia: {selectedBakuPembanding.stock}</p>
                        <p className="text-sm text-gray-600">Satuan: {selectedBakuPembanding.satuan}</p>
                        <p className="text-sm text-gray-600">Ed: {selectedBakuPembanding.expired ? dayjs(selectedBakuPembanding.expired).format("DD MMM YYYY") : '-'}</p>
                    </div>
                )}

                {/* Quantity and Add Button */}
                <div className="mt-4 flex gap-4 items-end">
                    <div className="">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah {selectedBakuPembanding ? `(Max: ${selectedBakuPembanding.stock})` : ''}
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={selectedBakuPembanding?.stock || 9999}
                            value={jumlah}
                            onChange={(e) => setJumlah(e.target.value)}
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
                        disabled={!selectedBakuPembanding}
                        className={`px-4 py-2 rounded ${selectedBakuPembanding
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
                    <h3 className="text-lg font-semibold mb-4">Daftar Baku Pembanding yang Diajukan</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left text-sm">No</th>
                                    <th className="p-2 text-left text-sm">Kode Baru</th>
                                    <th className="p-2 text-left text-sm">Nama</th>
                                    <th className="p-2 text-left text-sm">Letak</th>
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
                                        <td className="p-2 text-sm">{item.kode_baru || '-'}</td>
                                        <td className="p-2 text-sm">{item.nama}</td>
                                        <td className="p-2 text-sm">{item.letak || '-'}</td>
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
