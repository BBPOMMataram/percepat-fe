import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import api from "@/utils/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Webcam from "react-webcam";

interface PresensiModalProps {
    show: boolean;
    onClose: () => void;
    url: string;
    title: string;
    userName: string;
    onPresensiUpdated?: () => void;
}

export default function ModalWebcamSiapMelayani({
    show,
    onClose,
    url,
    title,
    userName,
    onPresensiUpdated
}: PresensiModalProps) {
    const [latitude, setLatitude] = useState<string>("");
    const [longitude, setLongitude] = useState<string>("");
    const [selfie, setSelfie] = useState<string>("");

    const webcamRef = useRef<Webcam>(null);

    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        if (show && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLatitude(pos.coords.latitude.toString());
                    setLongitude(pos.coords.longitude.toString());
                },
                () => alert("Gagal mengambil lokasi. Izinkan akses lokasi.")
            );
        }
    }, [show]);

    const takeSnapshot = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) setSelfie(imageSrc);
    };

    const resetSnapshot = () => {
        setSelfie("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selfie) {
            alert("Selfie dulu sebelum submit!");
            return;
        }

        const formData = new FormData(e.currentTarget);
        formData.append("latitude", latitude);
        formData.append("longitude", longitude);
        formData.append("selfie", selfie);

        try {
            const res = await api.post(url, formData);

            if (res.status === 200) {
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                onClose();
                setSelfie("");
                onPresensiUpdated && onPresensiUpdated(); // agar datapresensi parent terupdate
            }
        } catch (error: any) {
            dispatch(showAlert({ type: "error", message: error?.response?.data?.message, description: error?.response?.data?.message || "No Message from Backend" }));
            onClose();
            setSelfie("");
        }
    };

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 overflow-auto h-[calc(100vh-2rem)]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold">{title}</h2>
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="latitude" value={latitude} />
                    <input type="hidden" name="longitude" value={longitude} />
                    <input type="hidden" name="selfie" value={selfie} />

                    <div className="mb-4">
                        {userName}
                    </div>

                    <div className="mb-4">
                        <label className="block">Keterangan</label>
                        <input
                            type="text"
                            name="keterangan"
                            className="ar-input-text-green w-full"
                            defaultValue={"Senyum ;)"}
                        />
                    </div>

                    <div className="flex flex-col items-center text-center rounded-lg p-6 shadow-lg bg-gradient-to-t from-blue-400 via-white to-green-400 text-gray-800">
                        <h2 className="text-lg font-serif font-semibold mb-2">
                            SELFIE 📷
                        </h2>

                        {!selfie ? (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="rounded-lg"
                                videoConstraints={{ facingMode: "user" }}
                            />
                        ) : (
                            <Image
                                src={selfie}
                                alt="Selfie"
                                className="w-80 h-auto rounded-lg shadow"
                                width={640}
                                height={480}
                            />
                        )}

                        <div className="flex w-full justify-between mt-2">
                            <button
                                type="button"
                                onClick={takeSnapshot}
                                className="flex-1 bg-green-300 px-4 py-2 hover:bg-green-400 rounded-l"
                            >
                                SHOT
                            </button>
                            <button
                                type="button"
                                onClick={resetSnapshot}
                                className="flex-1 bg-gray-200 px-4 py-2 hover:bg-gray-300 rounded-r"
                            >
                                ULANG
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}