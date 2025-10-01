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
import FormRegisterAdditionalExternal from "./FormAdditionalExternal";
import FormRegisterAdditionalMahasiswa from "./FormAdditionalMahasiswa";
import FormRegisterUserGeneral from "./FormUserGeneral";

export default function RegisterForm() {
    const [roleId, setRoleId] = useState<number>(3); // 3 = student

    const signatureSelectRef = useRef<any>(null)
    const formRegisterRef = useRef<any>(null)

    const dispatch = useDispatch<AppDispatch>();

    const router = useRouter();

    const { loading } = useSelector((state: RootState) => state.auth);

    // redirect ke form login setelah reg karena setelah register hanya membuat akun dan belum login
    const callbackUrl = "login";

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const formDataRegister = new FormData(formRegisterRef.current);

        // Get the signature data URL
        const signatureDataURL = signatureSelectRef.current.toDataURL();
        formDataRegister.append('signature_path', signatureDataURL);

        dispatch(register(formDataRegister))
            .unwrap()
            .then((data: LoginOrRegisterResponse) => {
                dispatch(showAlert({ type: "success", message: data.message || 'Register success', description: data.message ?? "No Message from Backend" }));
                console.log('Register success', data);
                router.push(callbackUrl);
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: "Register failed", description: err || "No Message from Backend" }));
                console.log('Register failed', err);
            });
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-lg rounded-2xl p-6 shadow-xl bg-white/70 font-serif my-4 overflow-auto max-h-[calc(100vh-2rem)] pr-8">
                <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto mb-6 w-auto h-auto" />
                <h1 className="text-center text-2xl font-bold tracking-wide">REGISTER FORM</h1>
                <p className="text-center mb-4 text-gray-500">Balai Besar POM di Mataram</p>

                <div className="mb-2 flex items-center gap-1 animate-pulse">
                    (<span className="ar-label-required"></span>)<span>Wajib diisi</span>
                </div>
                <form onSubmit={handleRegister} className="space-y-4" ref={formRegisterRef}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 ar-label-required">
                            Role
                        </label>
                        <select
                            name="role_id"
                            value={roleId}
                            onChange={(e) => setRoleId(parseInt(e.target.value))}
                            required
                            className="ar-input-text-purple"
                        >
                            <option value={3}>Mahasiswa</option>
                            <option value={2} disabled>Eksternal (Cooming soon)</option>
                        </select>
                    </div>

                    {/* FORM GENERAL */}
                    <FormRegisterUserGeneral />

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

                    {/* FORM MAHASISWA OR EXTERNAL */}
                    {roleId == 3 && <FormRegisterAdditionalMahasiswa />}
                    {roleId == 4 && <FormRegisterAdditionalExternal />}

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
            </div >
        </div >
    );
}