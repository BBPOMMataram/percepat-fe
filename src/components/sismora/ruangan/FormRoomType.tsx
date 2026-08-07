"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

function FormRoomTypeContent() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEditMode = !!editId;

    const [nama, setNama] = useState("");
    const [tempMin, setTempMin] = useState("");
    const [tempMax, setTempMax] = useState("");
    const [humMin, setHumMin] = useState("");
    const [humMax, setHumMax] = useState("");
    const [isHumidity, setIsHumidity] = useState(false);
    const [deskripsi, setDeskripsi] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editId) {
            api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/room-types/${editId}`)
                .then(({ data }) => {
                    const d = data.data || data;
                    setNama(d.nama || "");
                    setTempMin(d.temp_min ?? "");
                    setTempMax(d.temp_max ?? "");
                    setHumMin(d.hum_min ?? "");
                    setHumMax(d.hum_max ?? "");
                    setIsHumidity(d.is_humidity ?? false);
                    setDeskripsi(d.deskripsi || "");
                })
                .catch((err) => {
                    console.error(err);
                    dispatch(showAlert({ type: "error", message: "Gagal memuat data tipe ruangan", description: "Terjadi kesalahan saat mengambil data." }));
                });
        }
    }, [editId, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nama.trim()) {
            alert("Nama wajib diisi");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            nama: nama.trim(),
            temp_min: tempMin !== "" ? Number(tempMin) : null,
            temp_max: tempMax !== "" ? Number(tempMax) : null,
            hum_min: humMin !== "" ? Number(humMin) : null,
            hum_max: humMax !== "" ? Number(humMax) : null,
            is_humidity: isHumidity,
            deskripsi: deskripsi.trim(),
        };

        const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/room-types`;
        const url = isEditMode ? `${baseUrl}/${editId}` : baseUrl;

        const method = isEditMode ? "put" : "post";

        api[method](url, isEditMode ? { ...payload, _method: "PUT" } : payload)
            .then((res) => {
                dispatch(
                    showAlert({
                        type: "success",
                        message: res.data.message || `Berhasil ${isEditMode ? "memperbarui" : "menambahkan"} tipe ruangan`,
                        description: res.data.message || `Berhasil ${isEditMode ? "memperbarui" : "menambahkan"} tipe ruangan`,
                    })
                );
                router.push("/sismora/ruangan/room-types");
            })
            .catch((err) => {
                dispatch(
                    showAlert({
                        type: "error",
                        message: err?.response?.data?.message || "Terjadi kesalahan",
                        description: err?.response?.data?.message || "Terjadi kesalahan saat memproses data.",
                    })
                );
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-6">
                {isEditMode ? "Edit Tipe Ruangan" : "Tambah Tipe Ruangan"}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="Masukkan nama tipe ruangan"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Suhu Min (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={tempMin}
                            onChange={(e) => setTempMin(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Contoh: 20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Suhu Max (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={tempMax}
                            onChange={(e) => setTempMax(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Contoh: 25"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kelembaban Min (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={humMin}
                            onChange={(e) => setHumMin(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Contoh: 40"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kelembaban Max (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={humMax}
                            onChange={(e) => setHumMax(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Contoh: 60"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isHumidity}
                        onChange={(e) => setIsHumidity(e.target.checked)}
                        className="checkbox checkbox-primary"
                    />
                    <label className="text-sm font-medium text-gray-700">Aktifkan Monitoring Kelembaban</label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea
                        value={deskripsi}
                        onChange={(e) => setDeskripsi(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Deskripsi tipe ruangan (opsional)"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => router.push("/sismora/ruangan/room-types")}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span> Menyimpan...
                            </>
                        ) : isEditMode ? (
                            "Perbarui"
                        ) : (
                            "Simpan"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function FormRoomType() {
    return (
        <Suspense fallback={<div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg"></span></div>}>
            <FormRoomTypeContent />
        </Suspense>
    );
}
