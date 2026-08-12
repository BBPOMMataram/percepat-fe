"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

function FormMutationContent() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEditMode = !!editId;

    const [roomId, setRoomId] = useState("");
    const [tanggal, setTanggal] = useState("");
    const [jam, setJam] = useState("");
    const [temperature, setTemperature] = useState("");
    const [humidity, setHumidity] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [listRooms, setListRooms] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms?per_page=100`)
            .then(({ data }) => {
                setListRooms(Array.isArray(data) ? data : data?.data || []);
            })
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (editId) {
            api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/mutations/${editId}`)
                .then(({ data }) => {
                    const d = data.data || data;
                    setRoomId(d.room_id ?? "");
                    setTanggal(d.tanggal || "");
                    setJam(d.jam || "");
                    setTemperature(d.temperature ?? "");
                    setHumidity(d.humidity ?? "");
                    setDeskripsi(d.deskripsi || "");
                })
                .catch((err) => {
                    console.error(err);
                    dispatch(showAlert({ type: "error", message: "Gagal memuat data mutasi", description: "Terjadi kesalahan saat mengambil data." }));
                });
        }
    }, [editId, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomId) {
            alert("Ruangan wajib dipilih");
            return;
        }

        if (!tanggal) {
            alert("Tanggal wajib diisi");
            return;
        }

        if (!jam) {
            alert("Jam wajib diisi");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            room_id: Number(roomId),
            tanggal,
            jam,
            temperature: temperature !== "" ? Number(temperature) : null,
            humidity: humidity !== "" ? Number(humidity) : null,
            deskripsi: deskripsi.trim(),
        };

        const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/mutations`;
        const url = isEditMode ? `${baseUrl}/${editId}` : baseUrl;
        const method = isEditMode ? "put" : "post";

        api[method](url, isEditMode ? { ...payload, _method: "PUT" } : payload)
            .then((res) => {
                dispatch(
                    showAlert({
                        type: "success",
                        message: res.data.message || `Berhasil ${isEditMode ? "memperbarui" : "menambahkan"} mutasi`,
                        description: res.data.message || `Berhasil ${isEditMode ? "memperbarui" : "menambahkan"} mutasi`,
                    })
                );
                router.push("/sismora/mutasi");
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
                {isEditMode ? "Edit Mutasi" : "Tambah Mutasi"}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ruangan <span className="text-error">*</span>
                    </label>
                    <select
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="select select-bordered w-full"
                        required
                    >
                        <option value="">-- Pilih Ruangan --</option>
                        {listRooms.map((room: any) => (
                            <option key={room.id} value={room.id}>
                                {room.nama}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal <span className="text-error">*</span>
                        </label>
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="input input-bordered w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jam <span className="text-error">*</span>
                        </label>
                        <input
                            type="time"
                            value={jam}
                            onChange={(e) => setJam(e.target.value)}
                            className="input input-bordered w-full"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperatur
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Contoh: 23.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kelembaban
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={humidity}
                            onChange={(e) => setHumidity(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Contoh: 60.5"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea
                        value={deskripsi}
                        onChange={(e) => setDeskripsi(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Deskripsi mutasi (opsional)"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => router.push("/sismora/mutasi")}
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

export default function FormMutation() {
    return (
        <Suspense fallback={<div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg"></span></div>}>
            <FormMutationContent />
        </Suspense>
    );
}
