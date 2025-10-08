"use client";
import { useState } from "react";
import ModalWebcamSiapMelayani from "./ModalWebcam";

interface PresensiCardProps {
    checkInTime?: string | null;
    checkOutTime?: string | null;
    userName: string;
    onPresensiUpdated?: () => void
}

export default function PresensiCardSiapMelayani({
    checkInTime,
    checkOutTime,
    userName,
    onPresensiUpdated
}: PresensiCardProps) {
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState<string>("");
    const [url, setUrl] = useState<string>("");

    const openModal = (type: "in" | "out") => {
        if (type === "in") {
            setUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/check-in`);
            setTitle("Check In");
        } else {
            setUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/check-out`);
            setTitle("Check Out");
        }
        setShowModal(true);
    };

    return (
        <div className="bg-white p-6 shadow-lg rounded-2xl max-w-md mx-auto my-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                Presensi Anda Hari Ini
            </h2>

            <div className="flex justify-between mb-6">
                <div className="text-center">
                    <p className="text-sm text-gray-500">Waktu Check In</p>
                    <p className="text-lg font-medium text-green-600">
                        {checkInTime || "-"}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500">Waktu Check Out</p>
                    <p className="text-lg font-medium text-red-600">
                        {checkOutTime || "-"}
                    </p>
                </div>
            </div>

            <div className="flex justify-center gap-4">
                <button
                    onClick={() => openModal("in")}
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow transition"
                >
                    Check In
                </button>

                <button
                    onClick={() => openModal("out")}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow transition"
                >
                    Check Out
                </button>
            </div>

            <ModalWebcamSiapMelayani
                show={showModal}
                onClose={() => setShowModal(false)}
                url={url}
                title={title}
                userName={userName}
                onPresensiUpdated={onPresensiUpdated}
            />
        </div>
    );
}
