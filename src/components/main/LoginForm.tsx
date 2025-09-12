"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/features/authSlice";
import type { RootState, AppDispatch } from "@/redux/store";
import { showAlert } from "@/features/alertSlice";
import { LoginResponse } from "@/types/auth";
import Image from "next/image";

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
                dispatch(showAlert({ type: "success", message: data.message ?? "No Message from Backend", description: "Login success" }));
                router.push(callbackUrl);
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: err.message, description: "Login failed" }));
            });
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl bg-white/50 font-serif">
                <Image src="/assets/images/bpom.webp" alt="Icon BPOM" width={100} height={100} priority className="mx-auto mb-6" />
                <h1 className="text-center text-2xl font-bold tracking-wide">LOGIN FORM</h1>
                <p className="text-center mb-4 text-gray-500">Gate of Balai Besar POM di Mataram</p>

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
                            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-100"
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
                            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring focus:ring-blue-100"
                        />
                    </div>

                    {/* {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )} */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}