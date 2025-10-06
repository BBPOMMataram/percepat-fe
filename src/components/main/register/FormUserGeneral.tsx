"use client";

import Image from "next/image";
import { useState } from "react";

export default function FormRegisterUserGeneral() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [preview, setPreview] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <>
            {/* INI FIELDS YANG BISA DIISI OELH SEMUA USER (MHS MAUPUN EXTERNAL) ADAPUN ROLE ID DAN SIGNATURE DIBIARKAN DI FORM MAIN (RegisterForm.tsx) KARENA KEBUTUHAN STATE NYA */}
            <div>
                <label className="block text-sm font-medium text-gray-700 ar-label-required">
                    Nama
                </label>
                <input
                    name="name"
                    type="text"
                    required
                    className="ar-input-text-purple w-full"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 ar-label-required">
                    Email
                </label>
                <input
                    name="email"
                    type="email"
                    required
                    className="ar-input-text-purple w-full"
                />
            </div>

            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 ar-label-required">
                    Password
                </label>
                <input
                    autoComplete="new-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="ar-input-text-purple w-full"
                />
                <button
                    tabIndex={-1}
                    type="button"
                    className="absolute right-3 top-8 text-[#8b5cf6]"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {
                        showPassword ?
                            <span className="material-symbols-outlined !text-[20px]">visibility_off</span>
                            : <span className="material-symbols-outlined !text-[20px]">visibility</span>
                    }
                </button>
            </div>

            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 ar-label-required">
                    Ketik Ulang Password
                </label>
                <input
                    name="password_confirmation"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="ar-input-text-purple w-full"
                />
                <button
                    tabIndex={-1}
                    type="button"
                    className="absolute right-3 top-8 text-[#8b5cf6]"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    {
                        showConfirmPassword ?
                            <span className="material-symbols-outlined !text-[20px]">visibility_off</span>
                            : <span className="material-symbols-outlined !text-[20px]">visibility</span>
                    }
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    NIK
                </label>
                <input
                    name="nik"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Nama Panggilan
                </label>
                <input
                    name="call_name"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    No HP / WA
                </label>
                <input
                    name="phone"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Alamat
                </label>
                <input
                    name="address"
                    type="text"
                    className="ar-input-text-purple w-full"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Foto Profil
                </label>
                <input
                    name="photo_path"
                    type="file"
                    className="ar-input-text-purple"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e)}
                />
                {
                    preview &&
                    <div className="mt-4 mb-8 w-auto h-60 relative">
                        <Image src={preview} alt="Foto Profil" fill className="object-contain" />
                    </div>
                }
            </div>
        </>
    );
}