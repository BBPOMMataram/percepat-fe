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
    initialData?: any;
    onSuccess?: () => void;
}

export default function AdminPenerimaanFormSukuCadangPercepat({ open, onClose, initialData, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        sukuCadangId: "",
        jumlah: "",
        vendor: "",
        tglTerima: "",
    });
    const [tglTerimaSelected, setTglTerimaSelected] = useState<string>(dayjs().format("YYYY-MM-DD"));

    // State for suku cadang dropdown
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [sukuCadangList, setSukuCadangList] = useState<any[]>([]);
    const [selectedSukuCadang, setSelectedSukuCadang] = useState<any>(null);
    const [isLoadingSukuCadang, setIsLoadingSukuCadang] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch<AppDispatch>()

    // Fetch suku cadang data with debounce
    const fetchSukuCadang = async (query: string) => {
        setIsLoadingSukuCadang(true);
        try {
            const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-suku-cadang-all?name=${query}&groupbyname=true`);
            setSukuCadangList(res.data || []);
        } catch (error) {
            console.error("Error fetching suku cadang:", error);
        } finally {
            setIsLoadingSukuCadang(false);
        }
    };

    // Handle search input change with debounce
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length === 0) {
            setSukuCadangList([]);
            setShowDropdown(false);
        } else {
            setShowDropdown(true);
            searchTimeoutRef.current = setTimeout(() => {
                fetchSukuCadang(value);
            }, 500);
        }
    };

    // Handle suku cadang selection
    const handleSelectSukuCadang = (sukuCadang: any) => {
        setSelectedSukuCadang(sukuCadang);
        setFormData((prev: any) => ({
            ...prev,
            sukuCadangId: sukuCadang.id,
        }));
        setSearchTerm(sukuCadang.name);
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

    // Fetch detail data when editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                sukuCadangId: initialData.suku_cadang_id || "",
                jumlah: initialData.jumlah ?? "",
                vendor: initialData.vendor || "",
            });
            setSelectedSukuCadang(initialData.sukuCadang);
            setSearchTerm(initialData.sukuCadang?.name || "");
            if (initialData.created_at) {
                setTglTerimaSelected(dayjs(initialData.created_at).format("YYYY-MM-DD"));
            }
        } else {
            setFormData({
                sukuCadangId: "",
                jumlah: "",
                vendor: "",
            });
            setSelectedSukuCadang(null);
            setSearchTerm("");
            setTglTerimaSelected(dayjs().format("YYYY-MM-DD"));
        }
        setSukuCadangList([]);
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

        if (!selectedSukuCadang) {
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
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-suku-cadang/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-suku-cadang`;

        const method = "POST";

        let payload = {
            ...formData,
            suku_cadang_id: selectedSukuCadang.id,
            jumlah: Number(formData.jumlah),
            vendor: formData.vendor,
            tglTerima: tglTerimaSelected,
            barangNama: selectedSukuCadang.name,
            barangSatuan: selectedSukuCadang.satuan,
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
                dispatch(showAlert({ type: 'success', message: res.data.message, description: res.data.message }));
                onSuccess?.();
                onClose();
                console.log('res', res);
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message || 'Terjadi kesalahan', description: err.data?.message }));
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
                        {/* Suku Cadang Dropdown */}
                        <div ref={dropdownRef} className="relative">
                            <label className="block text-sm font-medium mb-1">Pilih Barang Suku Cadang</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => searchTerm && setShowDropdown(true)}
                                placeholder="Cari suku cadang..."
                                className="input input-bordered w-full"
                                autoComplete="off"
                            />

                            {/* Dropdown Results */}
                            {showDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {isLoadingSukuCadang ? (
                                        <div className="p-3 text-center text-gray-500">Loading...</div>
                                    ) : sukuCadangList.length > 0 ? (
                                        sukuCadangList.map((sukuCadang: any, index: number) => (
                                            <div
                                                key={index}
                                                onClick={() => handleSelectSukuCadang(sukuCadang)}
                                                className={`p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 ${selectedSukuCadang?.id === sukuCadang.id ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="font-medium">{sukuCadang.name}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-gray-500">Tidak ada hasil</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedSukuCadang && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium">Barang Dipilih: {selectedSukuCadang.name}</p>
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

                        <div className="modal-action">
                            <button type="button" className="btn" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={`btn btn-primary ${loading ? "loading" : ""}`}
                                disabled={loading || !selectedSukuCadang}
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
