"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/features/authSlice";
import type { RootState, AppDispatch } from "@/redux/store";
import { showAlert } from "@/features/alertSlice";
import { LoginResponse } from "@/types/auth";

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
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
                <h1 className="mb-4 text-center text-2xl font-bold">Login</h1>

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
                            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
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
                            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
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