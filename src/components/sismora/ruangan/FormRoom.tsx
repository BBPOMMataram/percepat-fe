"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

function FormRoomContent() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEditMode = !!editId;

    const [nama, setNama] = useState("");
    const [roomTypeId, setRoomTypeId] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [listRoomTypes, setListRoomTypes] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/room-types?per_page=100`)
            .then(({ data }) => {
                setListRoomTypes(data.data || []);
            })
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (editId) {
            api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms/${editId}`)
                .then(({ data }) => {
                    const d = data.data || data;
                    setNama(d.nama || "");
                    setRoomTypeId(d.room_type_id ?? "");
                    setDeskripsi(d.deskripsi || "");
                })
                .catch((err) => {
                    console.error(err);
                    dispatch(showAlert({ type: "error", message: "Gagal memuat data ruangan", description: "Terjadi kesalahan saat mengambil data." }));
                });
        }
    }, [editId, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nama.trim()) {
            alert("Nama wajib diisi");
            return;
        }

        if (!roomTypeId) {
            alert("Tipe ruangan wajib dipilih");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            room_type_id: Number(roomTypeId),
            nama: nama.trim(),
            deskripsi: deskripsi.trim(),
        };

        const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms`;
        const url = isEditMode ? `${baseUrl}/${editId}` : baseUrl;

        const method = isEditMode ? "put" : "post";

        api[method](url, isEditMode ? { ...payload, _method: "PUT" } : payload)
            .then((res) => {
                dispatch(
                    showAlert({
                        type: "success",
                        message: res.data.message || `Berhasil ${isEditMode ? "memperbarui" : "menambahkan"} ruangan`,
                        description: res.data.message || `Berhasil ${isEditMode ? "memperbarui" : "menambahkan"} ruangan`,
                    })
                );
                router.push("/sismora/ruangan/rooms");
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
                {isEditMode ? "Edit Ruangan" : "Tambah Ruangan"}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Ruangan <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="Masukkan nama ruangan"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipe Ruangan <span className="text-error">*</span>
                    </label>
                    <select
                        value={roomTypeId}
                        onChange={(e) => setRoomTypeId(e.target.value)}
                        className="select select-bordered w-full"
                        required
                    >
                        <option value="">-- Pilih Tipe Ruangan --</option>
                        {listRoomTypes.map((rt) => (
                            <option key={rt.id} value={rt.id}>
                                {rt.nama}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea
                        value={deskripsi}
                        onChange={(e) => setDeskripsi(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Deskripsi ruangan (opsional)"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => router.push("/sismora/ruangan/rooms")}
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

export default function FormRoom() {
    return (
        <Suspense fallback={<div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg"></span></div>}>
            <FormRoomContent />
        </Suspense>
    );
}
