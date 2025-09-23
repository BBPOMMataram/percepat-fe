"use client";

import { showAlert } from "@/features/alertSlice";
import { login } from "@/features/authSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import { LoginResponse } from "@/types/auth";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { loading } = useSelector((state: RootState) => state.auth);

    const callbackUrl = searchParams.get("redirectUrl") || "admin";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        dispatch(login({ email, password }))
            .unwrap()
            .then((data: LoginResponse) => {
                console.log('user: ', data.user);

                dispatch(showAlert({ type: "success", message: `Welcome ${data.user.name} !`, description: data.message ?? "No Message from Backend" }));
                router.push(callbackUrl);
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: "Login failed", description: err || "No Message from Backend" }));
            });
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl bg-white/70 font-serif">
                <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto mb-6 w-auto h-auto" />
                <h1 className="text-center text-2xl font-bold tracking-wide">LOGIN FORM</h1>
                <p className="text-center mb-4 text-gray-500">Balai Besar POM di Mataram</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="ar-input-text w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="ar-input-text w-full"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="ar-btn-primary w-full"
                    >
                        {loading ? "Loading..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}