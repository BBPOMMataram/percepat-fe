"use client";

import { showAlert } from "@/features/alertSlice";
import { register } from "@/features/authSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import { LoginOrRegisterResponse } from "@/types/auth";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SignatureCanvas from "react-signature-canvas";

export default function RegisterForm() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [role_id, setRoleId] = useState<number>(3); // 3 = student
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [password_confirmation, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [call_name, setCallName] = useState("");
    const [photo_path, setPhotoPath] = useState("");
    const [signature_path, setSignaturePath] = useState("");
    const [nik, setNik] = useState("");

    const signatureSelectRef = useRef<any>(null)
    const formRegisterRef = useRef<any>(null)

    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { loading } = useSelector((state: RootState) => state.auth);

    // redirect ke form login setelah reg karena setelah register hanya membuat akun dan belum login
    const callbackUrl = "login";

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const formDataRegister = new FormData(formRegisterRef.current);

        // Get the signature data URL
        const signatureDataURL = signatureSelectRef.current.toDataURL();
        formDataRegister.append('signature_path', signatureDataURL);

        setSignaturePath(signatureDataURL);

        dispatch(register(formDataRegister))
            .unwrap()
            .then((data: LoginOrRegisterResponse) => {

                dispatch(showAlert({ type: "success", message: `Welcome ${data.user?.name} !`, description: data.message ?? "No Message from Backend" }));
                console.log('Register success', data);
                // router.push(callbackUrl);
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: "Register failed", description: err || "No Message from Backend" }));
                console.log('Register failed', err);

            });
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl bg-white/70 font-serif my-4 overflow-auto max-h-[calc(100vh-2rem)]">
                <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto mb-6 w-auto h-auto" />
                <h1 className="text-center text-2xl font-bold tracking-wide">REGISTER FORM</h1>
                <p className="text-center mb-4 text-gray-500">Balai Besar POM di Mataram</p>

                <form onSubmit={handleRegister} className="space-y-4" ref={formRegisterRef}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Role
                        </label>
                        <select
                            name="role_id"
                            value={role_id}
                            onChange={(e) => setRoleId(parseInt(e.target.value))}
                            required
                            className="ar-input-text-purple"
                        >
                            <option value={3}>Mahasiswa</option>
                            <option value={2} disabled>Eksternal (Cooming soon)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Nama
                        </label>
                        <input
                            name="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="ar-input-text-purple w-full"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Password
                        </label>
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="ar-input-text-purple w-full"
                        />
                        <button
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
                            value={password_confirmation}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="ar-input-text-purple w-full"
                        />
                        <button
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
                            value={nik}
                            onChange={(e) => setNik(e.target.value)}
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
                            value={call_name}
                            onChange={(e) => setCallName(e.target.value)}
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
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Tanda Tangan
                        </label>
                        <SignatureCanvas
                            canvasProps={{ className: 'ar-input-text-purple mt-1 w-56 h-40' }}
                            ref={signatureSelectRef}
                        />
                        <button className="mt-1 w-fit text-red-500 flex items-center justify-start gap-1 text-sm" type="button" onClick={() => signatureSelectRef.current.clear()}>
                            <span className="material-symbols-outlined !text-[20px]">
                                change_circle
                            </span> <span>Clear</span>
                        </button>
                    </div>

                    <div className="flex gap-0.5 mt-10">
                        <button
                            type="button"
                            disabled={loading}
                            className="ar-btn-purple flex gap-1 w-fit"
                            onClick={() => window.history.back()}
                        >
                            <span className="material-symbols-outlined">
                                arrow_left_alt
                            </span> <span>Back</span>
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="ar-btn-purple flex-1"
                        >
                            {loading ? "Loading..." : "Register"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}