"use client";

import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

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

    const tempInputRef = useRef<HTMLInputElement>(null);

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
                    setJam(d.jam ? (d.jam.length > 5 ? d.jam.slice(0, 5) : d.jam) : getCurrentTimeString());
                    setTemperature(d.temperature !== null && d.temperature !== undefined ? String(d.temperature) : "");
                    setHumidity(d.humidity !== null && d.humidity !== undefined ? String(d.humidity) : "");
                    setDeskripsi(d.deskripsi || "");
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Data mutasi dengan ID tersebut tidak ditemukan atau server tidak merespons.");
                });
        }
    }, [editId]);

    // Ambil object ruangan yang sedang terpilih beserta tipe ruangannya untuk monitoring
    const selectedRoom = listRooms.find((r) => String(r.id) === String(roomId));
    const selectedRoomType = selectedRoom?.room_type;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomId) {
            toast.error("Ruangan pemantauan wajib dipilih terlebih dahulu!");
            return;
        }

        if (!tanggal) {
            toast.error("Tanggal pemantauan wajib diisi!");
            return;
        }

        if (!jam) {
            toast.error("Jam pemantauan wajib diisi!");
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
                if (isEditMode) {
                    toast.success("Mutasi berhasil diperbarui!");
                    router.push("/sismora/mutasi");
                } else {
                    // MODE TAMBAH (INPUT BERULANG):
                    // 1. Reset isi form TANPA mereset ruangannya (roomId tetap)
                    setTemperature("");
                    setHumidity("");
                    setDeskripsi("");
                    setJam(getCurrentTimeString());

                    // 2. Tampilkan notifikasi berhasil (sama persis dengan notifikasi hapus)
                    toast.success("Mutasi berhasil disimpan!");

                    // 3. Fokuskan kembali kursor ke input suhu untuk kemudahan input berulang
                    setTimeout(() => {
                        tempInputRef.current?.focus();
                    }, 100);
                }
            })
            .catch((err) => {
                // Parsing alasan spesifik mengapa gagal
                let reason = "";
                const resData = err?.response?.data;

                if (resData?.errors) {
                    if (typeof resData.errors === "object" && !Array.isArray(resData.errors)) {
                        const errorMessages: string[] = [];
                        Object.entries(resData.errors).forEach(([field, msgs]) => {
                            if (Array.isArray(msgs)) {
                                errorMessages.push(...msgs);
                            } else if (typeof msgs === "string") {
                                errorMessages.push(msgs);
                            }
                        });
                        if (errorMessages.length > 0) {
                            reason = errorMessages.join(". ");
                        }
                    } else if (typeof resData.errors === "string") {
                        reason = resData.errors;
                    }
                }

                if (!reason && resData?.message) {
                    reason = resData.message;
                }

                if (!reason) {
                    if (err?.code === "ERR_NETWORK" || !err?.response) {
                        reason = "Tidak dapat terhubung ke server backend Sismora. Pastikan service backend aktif.";
                    } else if (err?.response?.status === 401) {
                        reason = "Sesi login Anda telah berakhir. Silakan login kembali ke sistem.";
                    } else if (err?.response?.status === 403) {
                        reason = "Akun Anda tidak memiliki hak akses untuk menyimpan data mutasi ini.";
                    } else if (err?.response?.status === 404) {
                        reason = "Ruangan yang dipilih tidak ditemukan di database server.";
                    } else if (err?.response?.status === 422) {
                        reason = "Format input atau isian form belum memenuhi ketentuan.";
                    } else if (err?.response?.status >= 500) {
                        reason = "Terjadi gangguan pada database server Sismora saat memproses data.";
                    } else {
                        reason = "Terjadi kendala pada pengiriman data.";
                    }
                }

                toast.error(`Gagal: ${reason}`);
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <div className="max-w-2xl mx-auto p-2 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                        {isEditMode ? "Edit Mutasi Ruangan" : "Input Mutasi Ruangan"}
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {isEditMode
                            ? "Perbarui data pemantauan suhu dan kelembaban ruangan"
                            : "Input data pemantauan ruangan (mendukung input berulang di ruangan yang sama)"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => router.push("/sismora/mutasi")}
                    className="btn btn-sm btn-outline border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 shrink-0 cursor-pointer"
                >
                    Lihat Tabel Mutasi
                </button>
            </div>



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
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Jam <span className="text-error">*</span>
                            </label>
                            <span className="text-xs text-gray-400">Pilihan Cepat</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="time"
                                value={jam}
                                onChange={(e) => setJam(e.target.value)}
                                className="input input-bordered flex-1 min-w-0"
                                required
                            />
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setJam("08:00")}
                                    className={`btn btn-sm transition-all ${
                                        jam.startsWith("08:00")
                                            ? "btn-primary text-white shadow-sm font-semibold"
                                            : "btn-outline border-gray-300 text-gray-700 hover:bg-primary/10 hover:border-primary"
                                    }`}
                                    title="Set ke jam 08:00 (Pagi)"
                                >
                                    08:00
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setJam("13:00")}
                                    className={`btn btn-sm transition-all ${
                                        jam.startsWith("13:00")
                                            ? "btn-primary text-white shadow-sm font-semibold"
                                            : "btn-outline border-gray-300 text-gray-700 hover:bg-primary/10 hover:border-primary"
                                    }`}
                                    title="Set ke jam 13:00 (Siang)"
                                >
                                    13:00
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperatur (°C)
                        </label>
                        <input
                            ref={tempInputRef}
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

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 items-center justify-between border-t border-gray-100">
                    <button
                        type="button"
                        className="btn btn-ghost w-full sm:w-auto text-gray-600 hover:bg-gray-100 cursor-pointer"
                        onClick={() => router.push("/sismora/mutasi")}
                    >
                        {isEditMode ? "Batal" : "Selesai & Ke Tabel Mutasi"}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary w-full sm:w-auto px-7 shadow-sm cursor-pointer"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span> Menyimpan...
                            </>
                        ) : isEditMode ? (
                            "Perbarui Data"
                        ) : (
                            "Simpan Data"
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
