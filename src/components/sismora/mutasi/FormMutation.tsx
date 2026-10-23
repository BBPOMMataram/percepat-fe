"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
};

function FormMutationContent() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const isEditMode = !!editId;

    const [roomId, setRoomId] = useState("");
    const [tanggal, setTanggal] = useState(getTodayString());
    const [jam, setJam] = useState(getCurrentTimeString());
    const [temperature, setTemperature] = useState("");
    const [humidity, setHumidity] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [listRooms, setListRooms] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/rooms?per_page=1000`)
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
                    setRoomId(d.room_id ? String(d.room_id) : "");
                    setTanggal(d.tanggal || getTodayString());
                    setJam(d.jam || getCurrentTimeString());
                    setTemperature(d.temperature !== null && d.temperature !== undefined ? String(d.temperature) : "");
                    setHumidity(d.humidity !== null && d.humidity !== undefined ? String(d.humidity) : "");
                    setDeskripsi(d.deskripsi || "");
                })
                .catch((err) => {
                    console.error(err);
                    dispatch(showAlert({ type: "error", message: "Gagal memuat data mutasi", description: "Terjadi kesalahan saat mengambil data." }));
                });
        }
    }, [editId, dispatch]);

    // Ambil object ruangan yang sedang terpilih beserta tipe ruangannya untuk monitoring
    const selectedRoom = listRooms.find((r) => String(r.id) === String(roomId));
    const selectedRoomType = selectedRoom?.room_type;

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
        <div className="max-w-2xl mx-auto p-2 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
                {isEditMode ? "Edit Mutasi" : "Tambah Mutasi"}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4">
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
                                {room.nama} {room.room_type?.nama ? `(${room.room_type.nama})` : ""}
                            </option>
                        ))}
                    </select>

                    {/* Informasi Standar Tipe Ruangan untuk Monitoring */}
                    {selectedRoomType && (
                        <div className="mt-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-gray-700 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">Tipe Ruangan:</span>
                                <span className="badge badge-primary badge-sm text-white font-medium">
                                    {selectedRoomType.nama}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                                <span>
                                    Standar Monitoring Suhu:{" "}
                                    <strong className="text-orange-600">
                                        {selectedRoomType.temp_min !== null ? `${selectedRoomType.temp_min} - ` : "≤ "}
                                        {selectedRoomType.temp_max}°C
                                    </strong>
                                </span>
                                <span>
                                    Standar Monitoring Kelembaban:{" "}
                                    <strong className="text-blue-600">
                                        {selectedRoomType.is_humidity
                                            ? `${selectedRoomType.hum_min !== null ? `${selectedRoomType.hum_min} - ` : "< "}${selectedRoomType.hum_max}%`
                                            : "Tidak dipantau"}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperatur (°C)
                        </label>
                        <input
                            type="number"
                            step="any"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Contoh: 23.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kelembaban (%)
                        </label>
                        <input
                            type="number"
                            step="any"
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

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button
                        type="button"
                        className="btn btn-ghost w-full sm:w-auto"
                        onClick={() => router.push("/sismora/mutasi")}
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary w-full sm:w-auto"
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
