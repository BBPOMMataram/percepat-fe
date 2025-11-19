import { showAlert } from "@/features/alertSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface ModalDisposisiPemeliharaanProps {
    show: boolean;
    onClose: () => void;
    code: string;
}

export default function ModalDisposisiPemeliharaan({
    show,
    onClose,
    code,
}: ModalDisposisiPemeliharaanProps) {
    const dispatch = useDispatch<AppDispatch>();

    const [detailData, setDetailData] = useState<any>(null);
    // const [pelaporData, setPelaporData] = useState<any>(null);
    const [note, setNote] = useState<string>("");
    const [kabalai, setKabalai] = useState<any>(null);

    const { user } = useSelector((state: RootState) => state.auth);

    const getDetailPemeliharaan = useCallback(() => {
        if (!code) return; // hindari fetch kalau code kosong/null

        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-detail`,
            { code }
        ).then((res) => {
            setDetailData(res?.data);
        }).catch((err) => {
            console.log(err);
        });
    }, [code]);

    const getKaBalai = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-kabalai`
        ).then((res) => {
            setKabalai(res.data?.user); // karena "data" disini adalah employee
        })
    }

    useEffect(() => {
        if (show && code) {
            getDetailPemeliharaan();
            getKaBalai();
        }
    }, [show, code, getDetailPemeliharaan]);

    const submitDisposisi = (isRejected = false) => {
        if (!window.confirm(`Apakah Anda yakin ingin ${isRejected ? 'menolak' : 'melanjutkan'} disposisi ini?`)) {
            return;
        }

        const isKaTu = user?.employee?.group_jabatan?.id === 2
        const isKatimPengujian = user?.employee?.is_katim_pengujian
        const isKaBalai = user?.employee?.group_jabatan?.id === 1
        const isPetugasBmn = user?.employee?.petugas_bmn

        let toUser = null;
        let lastStatusDisposisi = null;
        if (isKaTu || isKatimPengujian) {
            lastStatusDisposisi = isRejected ? 'rejected' : 'forwarded'; // status disposisi sebelum nya diteruskan ke kabalai
            toUser = kabalai;
        } else if (isKaBalai) {
            toUser = 'petugas';
            lastStatusDisposisi = isRejected ? 'rejected' : 'forwarded'; // status disposisi sebelum nya diteruskan ke kabalai
        } else if (isPetugasBmn) {
            toUser = kabalai;
        }

        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/next-disposition`,
            {
                code,
                fromUser: user,
                toUser,
                note,
                lastStatusDisposisi
            })
            .then((res) => {
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }));
                console.log(res.data);
                closeModal();
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                console.log(err);
            })
    }

    const closeModal = () => {
        setNote("");
        onClose();
    }

    if (!show) return null;
    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            onClick={closeModal}
        >
            <div
                className="bg-white rounded-lg p-6 w-full max-w-6xl space-y-4 mx-4 overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold font-serif">Disposisi</h2>
                <textarea className="ar-input-text-purple w-full h-20"
                    placeholder={`Catatan`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}></textarea>

                <div className="flex ml-auto w-fit gap-4">
                    <button
                        type="button"
                        onClick={() => submitDisposisi(false)}
                        className="btn btn-primary mt-6"
                    >
                        Kirim
                    </button>
                    <button
                        type="button"
                        onClick={() => submitDisposisi(true)}
                        className="btn btn-error mt-6"
                    >
                        Tolak
                    </button>
                    <button
                        type="button"
                        onClick={closeModal}
                        className="btn mt-6"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    )
}