"use client";

import { ModalGeneral } from "@/components/main/ModalGeneral";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

function LaporanMutasiContent() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const mutasiId = searchParams.get("mutasi_id");

    const [laporan, setLaporan] = useState<any>(null);
    const [mutasi, setMutasi] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModalDelete, setShowModalDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(() => {
        if (!mutasiId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const fetchMutasi = api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/mutations/${mutasiId}`);
        const fetchLaporan = api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/laporans?mutasi_id=${mutasiId}`);

        Promise.all([fetchMutasi, fetchLaporan])
            .then(([mutasiRes, laporanRes]) => {
                setMutasi(mutasiRes.data.data || mutasiRes.data);
                const laporans = Array.isArray(laporanRes.data) ? laporanRes.data : laporanRes.data?.data || [];
                setLaporan(laporans.length > 0 ? laporans[0] : null);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Gagal memuat data");
            })
            .finally(() => setLoading(false));
    }, [mutasiId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = () => {
        if (!laporan?.id) return;
        setIsDeleting(true);

        api.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/laporans/${laporan.id}`)
            .then(() => {
                toast.success("Laporan berhasil dihapus!");
                setShowModalDelete(false);
                setLaporan(null);
            })
            .catch((err) => {
                console.error(err);
                toast.error(err?.response?.data?.message || "Gagal menghapus laporan!");
            })
            .finally(() => setIsDeleting(false));
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!mutasiId) {
        return (
            <div className="text-center py-10 text-gray-500">
                ID mutasi tidak ditemukan.
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6 no-print">
                <h1 className="text-2xl font-semibold">Laporan Mutasi</h1>
                <div className="flex gap-2">
                    <button className="btn btn-ghost" onClick={() => router.push("/sismora/mutasi")}>
                        Kembali
                    </button>
                    {laporan && (
                        <>
                            <button className="btn btn-ghost btn-warning" onClick={() => router.push(`/sismora/mutasi/laporan/form?id=${laporan.id}&mutasi_id=${mutasiId}`)}>
                                <span className="material-symbols-outlined text-[20px]!">edit</span>
                                Edit
                            </button>
                            <button className="btn btn-ghost btn-error" onClick={() => setShowModalDelete(true)}>
                                <span className="material-symbols-outlined text-[20px]!">delete</span>
                                Hapus
                            </button>
                            <button className="btn btn-primary" onClick={handlePrint}>
                                <span className="material-symbols-outlined text-[20px]!">print</span>
                                Cetak
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Info Mutasi */}
            {mutasi && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Data Mutasi</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Ruangan</p>
                            <p className="font-medium">{mutasi.room?.nama || mutasi.room_id || "-"}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Tanggal</p>
                            <p className="font-medium">{mutasi.tanggal || "-"}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Jam</p>
                            <p className="font-medium">{mutasi.jam || "-"}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Temperatur</p>
                            <p className="font-medium">{mutasi.temperature != null ? `${mutasi.temperature}°C` : "-"}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Kelembaban</p>
                            <p className="font-medium">{mutasi.humidity != null ? `${mutasi.humidity}%` : "-"}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Deskripsi</p>
                            <p className="font-medium">{mutasi.deskripsi || "-"}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Laporan */}
            {laporan ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-none">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-bold uppercase">Laporan Mutasi Ruangan</h2>
                        <p className="text-gray-500 text-sm mt-1">Sistem Informasi Manajemen Ruangan (SISMORA)</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Problem</p>
                            <p className="font-medium whitespace-pre-wrap">{laporan.problem || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Hasil Evaluasi</p>
                            <p className="font-medium whitespace-pre-wrap">{laporan.hasil_evaluasi || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tindakan Perbaikan</p>
                            <p className="font-medium whitespace-pre-wrap">{laporan.tindakan_perbaikan || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tindakan Pencegahan</p>
                            <p className="font-medium whitespace-pre-wrap">{laporan.tindakan_pencegahan || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Hasil Verifikasi</p>
                            <p className="font-medium whitespace-pre-wrap">{laporan.hasil_verifikasi || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Follow Up</p>
                            <p className="font-medium whitespace-pre-wrap">{laporan.followup || "-"}</p>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center no-print">
                        Dicetak pada {new Date().toLocaleString("id-ID")}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center no-print">
                    <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">description</span>
                    <p className="text-gray-500 mb-6">Belum ada laporan untuk mutasi ini.</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => router.push(`/sismora/mutasi/laporan/form?mutasi_id=${mutasiId}`)}
                    >
                        <span className="material-symbols-outlined text-[20px]!">add</span>
                        Buat Laporan
                    </button>
                </div>
            )}

            {/* Modal Hapus */}
            {showModalDelete && (
                <ModalGeneral open={showModalDelete} onClose={() => setShowModalDelete(false)}>
                    <div className="text-center">
                        <span className="material-symbols-outlined text-error text-5xl mb-3">warning</span>
                        <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
                        <p className="text-gray-500 mb-6">
                            Apakah Anda yakin ingin menghapus laporan ini? <br />
                            <span className="text-error font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                        </p>
                        <div className="flex justify-center gap-3">
                            <button className="btn btn-ghost" onClick={() => setShowModalDelete(false)} disabled={isDeleting}>
                                Batal
                            </button>
                            <button className="btn btn-error" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span> Menghapus...
                                    </>
                                ) : (
                                    "Ya, Hapus"
                                )}
                            </button>
                        </div>
                    </div>
                </ModalGeneral>
            )}

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
}

export default function LaporanMutasi() {
    return (
        <Suspense fallback={<div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg"></span></div>}>
            <LaporanMutasiContent />
        </Suspense>
    );
}
