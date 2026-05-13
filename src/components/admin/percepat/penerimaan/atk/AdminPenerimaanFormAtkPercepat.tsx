"use client";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

interface Props {
    open: boolean;
    onClose: () => void;
    initialData?: any; // data yang mau diedit, kalau null berarti form untuk tambah baru
    onSuccess?: () => void; // callback kalau data berhasil disimpan
}

export default function AdminPenerimaanFormAtkPercepat({ open, onClose, initialData, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        atkId: "",
        jumlah: "",
        vendor: "",
        tglTerima: "",
    });
    const [tglTerimaSelected, setTglTerimaSelected] = useState<string>(dayjs().format("YYYY-MM-DD"));

    // State for atk dropdown
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [atkList, setAtkList] = useState<any[]>([]);
    const [selectedAtk, setSelectedAtk] = useState<any>(null);
    const [isLoadingAtk, setIsLoadingAtk] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch<AppDispatch>()

    // Fetch atk data with debounce
    const fetchAtk = async (query: string) => {
        setIsLoadingAtk(true);
        try {
            const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-atk-all?name=${query}&groupbyname=true`);
            setAtkList(res.data || []);
        } catch (error) {
            console.error("Error fetching atk:", error);
        } finally {
            setIsLoadingAtk(false);
        }
    };

    // Handle search input change with debounce
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length === 0) {
            setAtkList([]);
            setShowDropdown(false);
        } else {
            setShowDropdown(true);
            // Debounce: wait 500ms before fetching
            searchTimeoutRef.current = setTimeout(() => {
                fetchAtk(value);
            }, 500);
        }
    };

    // Handle atk selection
    const handleSelectAtk = (atk: any) => {
        setSelectedAtk(atk);
        setFormData((prev: any) => ({
            ...prev,
            atkId: atk.id,
        }));
        setSearchTerm(atk.name);
        setShowDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (initialData) {
            console.log('initial data: ', initialData);

            setFormData({
                atkId: initialData.atk_id || initialData.atk?.id || "",
                jumlah: initialData.jumlah ?? "",
                vendor: initialData.vendor || "",
                // tglTerima: initialData.tglTerima || "", // Use created_at for display
            });
            setSelectedAtk(initialData.atk);
            setSearchTerm(initialData.atk?.name || "");

            // Use created_at for tglTerima display (table shows it)
            if (initialData.created_at) {
                setTglTerimaSelected(dayjs(initialData.created_at).format("YYYY-MM-DD"));
            }

            // Try barang.expired first, then penerimaan.expired
            // if (initialData.barang?.expired) {
            //     setTglExpiredSelected(dayjs(initialData.barang.expired).format("YYYY-MM-DD"));
            // } else if (initialData.expired) {
            //     setTglExpiredSelected(dayjs(initialData.expired).format("YYYY-MM-DD"));
            // }
        } else {
            setFormData({
                atkId: "",
                jumlah: "",
                vendor: "",
                // tglTerima: "",
            });
            setSelectedAtk(null);
            setSearchTerm("");
            setTglTerimaSelected(dayjs().format("YYYY-MM-DD"));
            // setTglExpiredSelected("");
        }
        setAtkList([]);
    }, [initialData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: name === "jumlah" ? (value || 0) : (value || ""),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (!selectedAtk) {
            dispatch(showAlert({ type: 'error', message: 'Barang wajib dipilih', description: 'input validation failed' }));
            return;
        }
        if (!formData.jumlah || formData.jumlah <= 0) {
            dispatch(showAlert({ type: 'error', message: 'Jumlah tidak boleh kosong', description: 'input validation failed' }));
            return;
        }
        if (!formData.vendor?.trim()) {
            dispatch(showAlert({ type: 'error', message: 'Vendor tidak boleh kosong', description: 'input validation failed' }));
            return;
        }
        if (!tglTerimaSelected) {
            dispatch(showAlert({ type: 'error', message: 'Tanggal Terima tidak boleh kosong', description: 'input validation failed' }));
            return;
        }

        setLoading(true);

        const url = initialData
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-atk/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-atk`;

        const method = "POST";

        let payload = {
            ...formData,
            atkId: selectedAtk.id,
            jumlah: Number(formData.jumlah),
            tglTerima: tglTerimaSelected,
            // tglExpired: tglExpiredSelected || null,
            barangNama: selectedAtk.name,
            barangSatuan: selectedAtk.satuan,
        };

        if (initialData) {
            payload = {
                ...payload,
                _method: 'PUT'
            };
        }

        await api({
            url, method, data: payload
        })
            .then((res) => {
                dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message }))
                onSuccess?.(); // refresh data di parent
                onClose();
                console.log('res', res);
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message || 'Terjadi kesalahan', description: err.data?.message }))
                console.log(err);
            })
        setLoading(false);
    };

    return (
        <>
            <input
                type="checkbox"
                className="modal-toggle"
                checked={open}
                onChange={onClose}
            />
            <div className="modal modal-bottom sm:modal-middle">
                <div className="modal-box">
                    <h3 className="font-bold text-lg mb-4">
                        {initialData ? "Edit Data" : "Add new data"}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* ATK Dropdown */}
                        <div ref={dropdownRef} className="relative">
                            <label className="block text-sm font-medium mb-1">Pilih Barang ATK</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => searchTerm && setShowDropdown(true)}
                                placeholder="Cari atk..."
                                className="input input-bordered w-full"
                                autoComplete="off"
                            />

                            {/* Dropdown Results */}
                            {showDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {isLoadingAtk ? (
                                        <div className="p-3 text-center text-gray-500">Loading...</div>
                                    ) : atkList.length > 0 ? (
                                        atkList.map((atk: any, index: number) => (
                                            <div
                                                key={index}
                                                onClick={() => handleSelectAtk(atk)}
                                                className={`p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 ${selectedAtk?.id === atk.id ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="font-medium">{atk.name}</div>
                                                {/* <div className="text-sm text-gray-500">
                                                    Stok: {atk.stock} | Satuan: {atk.satuan}
                                                </div> */}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-gray-500">Tidak ada hasil</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedAtk && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium">Barang Dipilih: {selectedAtk.name}</p>
                                {/* <p className="text-sm text-gray-600">Stok Tersedia: {selectedAtk.stock}</p>
                                <p className="text-sm text-gray-600">Satuan: {selectedAtk.satuan}</p> */}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Jumlah</label>
                            <input
                                type="number"
                                name="jumlah"
                                value={formData.jumlah}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full"
                                min={1}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Vendor</label>
                            <input
                                type="text"
                                name="vendor"
                                value={formData.vendor}
                                onChange={handleChange}
                                required
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tanggal Terima
                            </label>
                            <input
                                type="date"
                                value={tglTerimaSelected}
                                onChange={(e) => setTglTerimaSelected(e.target.value)}
                                className="ar-input-text-purple"
                            />
                        </div>

                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tanggal Expired
                            </label>
                            <input
                                type="date"
                                value={tglExpiredSelected}
                                onChange={(e) => setTglExpiredSelected(e.target.value)}
                                className="ar-input-text-purple"
                            />
                        </div> */}

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-primary ${loading ? "loading" : ""}`}
                                disabled={loading || !selectedAtk}
                            >
                                {initialData ? "Update" : "Submit"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
