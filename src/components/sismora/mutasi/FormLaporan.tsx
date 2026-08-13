"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

function FormLaporanContent() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id");
    const mutasiId = searchParams.get("mutasi_id");
    const isEditMode = !!editId;

    const [problem, setProblem] = useState("");
    const [hasilEvaluasi, setHasilEvaluasi] = useState("");
    const [tindakanPerbaikan, setTindakanPerbaikan] = useState("");
    const [tindakanPencegahan, setTindakanPencegahan] = useState("");
    const [hasilVerifikasi, setHasilVerifikasi] = useState("");
    const [followup, setFollowup] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editId) {
            api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/laporans/${editId}`)
                .then(({ data }) => {
                    const d = data.data || data;
                    setProblem(d.problem || "");
                    setHasilEvaluasi(d.hasil_evaluasi || "");
                    setTindakanPerbaikan(d.tindakan_perbaikan || "");
                    setTindakanPencegahan(d.tindakan_pencegahan || "");
                    setHasilVerifikasi(d.hasil_verifikasi || "");
                    setFollowup(d.followup || "");
                })
                .catch((err) => {
                    console.error(err);
                    dispatch(showAlert({ type: "error", message: "Gagal memuat data laporan", description: "Terjadi kesalahan saat mengambil data." }));
                });
        }
    }, [editId, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);

        const payload: any = {
            mutasi_id: Number(mutasiId),
            problem: problem.trim() || null,
            hasil_evaluasi: hasilEvaluasi.trim() || null,
            tindakan_perbaikan: tindakanPerbaikan.trim() || null,
            tindakan_pencegahan: tindakanPencegahan.trim() || null,
            hasil_verifikasi: hasilVerifikasi.trim() || null,
            followup: followup.trim() || null,
        };

        const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL_SISMORA}/api/v1/laporans`;
        const url = isEditMode ? `${baseUrl}/${editId}` : baseUrl;
        const method = isEditMode ? "put" : "post";

        api[method](url, isEditMode ? { ...payload, _method: "PUT" } : payload)
            .then((res) => {
                dispatch(
                    showAlert({
                        type: "success",
                        message: res.data.message || `Berhasil ${isEditMode ? "memperbarui" : "menambahkan"} laporan`,
                        description: res.data.message || `Berhasil ${isEditMode ? "memperbarui" : "menambahkan"} laporan`,
                    })
                );
                router.push(`/sismora/mutasi/laporan?mutasi_id=${mutasiId}`);
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
                {isEditMode ? "Edit Laporan" : "Buat Laporan"}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Problem</label>
                    <textarea
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Deskripsi problem (opsional)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasil Evaluasi</label>
                    <textarea
                        value={hasilEvaluasi}
                        onChange={(e) => setHasilEvaluasi(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Hasil evaluasi (opsional)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tindakan Perbaikan</label>
                    <textarea
                        value={tindakanPerbaikan}
                        onChange={(e) => setTindakanPerbaikan(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Tindakan perbaikan (opsional)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tindakan Pencegahan</label>
                    <textarea
                        value={tindakanPencegahan}
                        onChange={(e) => setTindakanPencegahan(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Tindakan pencegahan (opsional)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasil Verifikasi</label>
                    <textarea
                        value={hasilVerifikasi}
                        onChange={(e) => setHasilVerifikasi(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Hasil verifikasi (opsional)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Follow Up</label>
                    <textarea
                        value={followup}
                        onChange={(e) => setFollowup(e.target.value)}
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Follow up (opsional)"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => router.push(`/sismora/mutasi/laporan?mutasi_id=${mutasiId}`)}
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

export default function FormLaporan() {
    return (
        <Suspense fallback={<div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg"></span></div>}>
            <FormLaporanContent />
        </Suspense>
    );
}
