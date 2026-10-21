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

export default function AdminPenerimaanFormBakuPembandingPercepat({ open, onClose, initialData, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        barangId: "",
        jumlah: "",
        vendor: "",
    });
    const [tglTerimaSelected, setTglTerimaSelected] = useState<string>(dayjs().format("YYYY-MM-DD"));
    const [tglExpiredSelected, setTglExpiredSelected] = useState<string>("");

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [bakuPembandingList, setBakuPembandingList] = useState<any[]>([]);
    const [selectedBakuPembanding, setSelectedBakuPembanding] = useState<any>(null);
    const [isLoadingBakuPembanding, setIsLoadingBakuPembanding] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch<AppDispatch>();

    const fetchBakuPembanding = async (query: string) => {
        setIsLoadingBakuPembanding(true);
        try {
            const res = await api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/barang-baku-pembanding-all?name=${query}&groupbyname=true`);
            setBakuPembandingList(res.data || []);
        } catch (error) {
            console.error("Error fetching baku pembanding:", error);
        } finally {
            setIsLoadingBakuPembanding(false);
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
            setShowDropdown(false);
        } else {
            setShowDropdown(true);
            searchTimeoutRef.current = setTimeout(() => {
                fetchBakuPembanding(value);
            }, 500);
        }
    };

    const handleSelectBakuPembanding = (bp: any) => {
        setSelectedBakuPembanding(bp);
        setFormData((prev: any) => ({
            ...prev,
            barangId: bp.id,
        }));
        setSearchTerm(bp.name);
        setShowDropdown(false);
    };

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
            const item = initialData.baku_pembanding || initialData.bakuPembanding || initialData.barang || {};
            setFormData({
                barangId: initialData.baku_pembanding_id || initialData.barangs_id || item.id || "",
                jumlah: initialData.jumlah ?? "",
                vendor: initialData.vendor || "",
            });
            setSelectedBakuPembanding(item);
            setSearchTerm(item.name || "");

            if (initialData.created_at) {
                setTglTerimaSelected(dayjs(initialData.created_at).format("YYYY-MM-DD"));
            }

            if (item.expired) {
                setTglExpiredSelected(dayjs(item.expired).format("YYYY-MM-DD"));
            } else if (initialData.expired) {
                setTglExpiredSelected(dayjs(initialData.expired).format("YYYY-MM-DD"));
            }
        } else {
            setFormData({
                barangId: "",
                jumlah: "",
                vendor: "",
            });
            setSelectedBakuPembanding(null);
            setSearchTerm("");
            setTglTerimaSelected(dayjs().format("YYYY-MM-DD"));
            setTglExpiredSelected("");
        }
        setBakuPembandingList([]);
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

        if (!selectedBakuPembanding) {
            dispatch(showAlert({ type: 'error', message: 'Baku Pembanding wajib dipilih', description: 'input validation failed' }));
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
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-baku-pembanding/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT}/api/v1/penerimaan-baku-pembanding`;

        const method = "POST";

        let payload = {
            ...formData,
            barangId: selectedBakuPembanding.id,
            baku_pembanding_id: selectedBakuPembanding.id,
            kode_baru: selectedBakuPembanding.kode_baru || null,
            letak: selectedBakuPembanding.letak || null,
            jumlah: Number(formData.jumlah),
            tglTerima: tglTerimaSelected,
            tglExpired: tglExpiredSelected || null,
            barangNama: selectedBakuPembanding.name,
            barangSatuan: selectedBakuPembanding.satuan,
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
                dispatch(showAlert({ type: 'success', message: res.data.message || "Penerimaan berhasil disimpan!", description: res.data.message || "Success" }));
                onSuccess?.();
                onClose();
            })
            .catch(err => {
                dispatch(showAlert({ type: 'error', message: err.response?.data?.message || 'Terjadi kesalahan', description: err.data?.message || "Error" }));
                console.log(err);
            });
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
                        {initialData ? "Edit Penerimaan Baku Pembanding" : "Tambah Penerimaan Baku Pembanding"}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Dropdown search */}
                        <div ref={dropdownRef} className="relative">
                            <label className="block text-sm font-medium mb-1">Pilih Baku Pembanding</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => searchTerm && setShowDropdown(true)}
                                placeholder="Cari baku pembanding berdasarkan nama atau kode..."
                                className="input input-bordered w-full"
                                autoComplete="off"
                            />

                            {/* Dropdown Results */}
                            {showDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {isLoadingBakuPembanding ? (
                                        <div className="p-3 text-center text-gray-500">Loading...</div>
                                    ) : bakuPembandingList.length > 0 ? (
                                        bakuPembandingList.map((bp: any, index: number) => (
                                            <div
                                                key={index}
                                                onClick={() => handleSelectBakuPembanding(bp)}
                                                className={`p-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 ${selectedBakuPembanding?.id === bp.id ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="font-medium">{bp.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    Kode Baru: {bp.kode_baru || '-'} | Letak: {bp.letak || '-'} | Stok: {bp.stock} | Satuan: {bp.satuan}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-gray-500">Tidak ada hasil</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedBakuPembanding && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium">Baku Pembanding Dipilih: {selectedBakuPembanding.name}</p>
                                <p className="text-xs text-gray-600">Kode Baru: {selectedBakuPembanding.kode_baru || '-'}</p>
                                <p className="text-xs text-gray-600">Letak: {selectedBakuPembanding.letak || '-'}</p>
                                <p className="text-xs text-gray-600">Satuan: {selectedBakuPembanding.satuan}</p>
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tanggal Expired
                            </label>
                            <input
                                type="date"
                                value={tglExpiredSelected}
                                onChange={(e) => setTglExpiredSelected(e.target.value)}
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
                                disabled={loading || !selectedBakuPembanding}
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
