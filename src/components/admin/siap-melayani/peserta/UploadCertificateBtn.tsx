import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import { useDispatch } from "react-redux";

interface Props {
    id: number;
    onSuccess?: () => void;
}

export default function UploadCertificateBtn({ id, onSuccess }: Props) {
    const dispatch = useDispatch<AppDispatch>()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("peserta_id", id.toString());
            formData.append("sertifikat", file);

            const res = await api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/upload-sertifikat`, formData);

            dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
            onSuccess?.(); // refresh data di parent jika perlu
        } catch (err: any) {
            dispatch(showAlert({ type: 'error', message: err.response?.data?.message, description: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah sertifikat.' }))
        } finally {
            // reset input supaya bisa pilih file yang sama lagi
            e.target.value = "";
        }
    };

    return (
        <>
            <label
                className="btn btn-primary btn-circle btn-sm tooltip tooltip-left"
                data-tip="Upload Sertifikat"
            >
                <span className="material-symbols-outlined !text-sm">upload</span>
                <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUpload}
                />
            </label>
        </>
    );
}
