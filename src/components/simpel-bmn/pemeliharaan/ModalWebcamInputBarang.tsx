import React, { useRef } from "react";
import Webcam from "react-webcam";

interface ModalWebcamProps {
    index: number;
    updateBukti: (index: number, file: File | null) => void;
    onClose: () => void;
}

export const ModalWebcamInputBarang: React.FC<ModalWebcamProps> = ({
    index,
    updateBukti,
    onClose
}) => {

    const webcamRef = useRef<Webcam>(null);

    const ambilFoto = () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        const file = dataURLtoFile(
            imageSrc,
            `capture_${Date.now()}.png`
        );

        updateBukti(index, file);
        onClose();
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/png"
                    className="w-full rounded"
                />

                <div className="flex justify-end mt-4 gap-2">
                    <button className="btn" onClick={onClose}>
                        Batal
                    </button>
                    <button className="btn btn-primary" onClick={ambilFoto}>
                        Ambil Foto
                    </button>
                </div>
            </div>
        </div>
    );
};


/** UTIL: Convert Base64 → File */
function dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";

    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}
