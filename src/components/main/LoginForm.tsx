"use client";

import { showAlert } from "@/features/alertSlice";
import { getUser, login } from "@/features/authSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import { LoginOrRegisterResponse } from "@/types/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Turnstile from "react-turnstile";

export default function LoginForm() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const searchParams = useSearchParams();

    const { user, loading } = useSelector((state: RootState) => state.auth);
    const callbackUrl = searchParams.get("redirectUrl") || "/profile";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Turnstile & UX state
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaKey, setCaptchaKey] = useState(0);
    const [pendingSubmit, setPendingSubmit] = useState(false);
    const [submitting, setSubmitting] = useState(false); // ⬅ UX loading instant

    /* ===============================
       CHECK USER SESSION
    =============================== */
    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    useEffect(() => {
        if (loading) return;

        if (user) {
            dispatch(
                showAlert({
                    type: "success",
                    message: `You are already logged in ${user.call_name}`,
                    description: "Redirecting...",
                })
            );
            router.push(callbackUrl);
        }
    }, [user, loading, router, callbackUrl, dispatch]);

    /* ===============================
       LOGIN CORE
    =============================== */
    const doLogin = useCallback(() => {
        dispatch(login({ email, password, turnstile_token: captchaToken }))
            .unwrap()
            .then((data: LoginOrRegisterResponse) => {
                dispatch(
                    showAlert({
                        type: "success",
                        message: `Welcome ${data.user.call_name || data.user.name}!`,
                        description: data.message ?? "No Message from Backend",
                    })
                );
                router.push(callbackUrl);
            })
            .catch((err) => {
                setCaptchaKey((k) => k + 1);
                setCaptchaToken("");
                setPendingSubmit(false);
                setSubmitting(false); // ⬅ reset UX loading

                dispatch(
                    showAlert({
                        type: "error",
                        message: err?.error || "Login failed",
                        description: err?.message || "No Message from Backend",
                    })
                );
            });
    }, [email, password, captchaToken, dispatch, router, callbackUrl]);

    /* ===============================
       HANDLE SUBMIT (1x CLICK)
    =============================== */
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // UX feedback langsung
        if (!submitting) {
            setSubmitting(true);
        }

        // trigger invisible captcha
        // if (!captchaToken) {
        //     setShowCaptcha(true);
        //     setPendingSubmit(true);
        //     return;
        // }

        doLogin();
    };

    /* ===============================
       AUTO SUBMIT AFTER CAPTCHA
    =============================== */
    useEffect(() => {
        if (captchaToken && pendingSubmit) {
            doLogin();
        }
    }, [captchaToken, pendingSubmit, doLogin]);

    /* ===============================
       RENDER
    =============================== */
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl bg-white/70 font-serif">
                <Image
                    src="/assets/images/bpom.webp"
                    alt="Icon BPOM"
                    width={100}
                    height={100}
                    priority
                    className="mx-auto mb-6 w-auto h-auto"
                />

                <h1 className="text-center text-2xl font-bold tracking-wide">
                    LOGIN FORM
                </h1>
                <p className="text-center mb-4 text-gray-500">
                    Balai Besar POM di Mataram
                </p>

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
                            disabled={submitting}
                            className="ar-input-text-green w-full"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={submitting}
                            className="ar-input-text-green w-full"
                        />
                        <button
                            tabIndex={-1}
                            type="button"
                            className="absolute right-3 top-8"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <span className="material-symbols-outlined !text-[20px]">
                                {showPassword ? "visibility_off" : "visibility"}
                            </span>
                        </button>
                    </div>

                    {/* Invisible Turnstile (lazy mounted) */}
                    {showCaptcha && (
                        <Turnstile
                            key={captchaKey}
                            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                            onVerify={(token) => setCaptchaToken(token)}
                        />
                    )}

                    <div className="flex gap-0.5">
                        <button
                            type="button"
                            disabled={submitting || loading}
                            className="ar-btn-green flex gap-1 w-fit"
                            onClick={() => window.history.back()}
                        >
                            <span className="material-symbols-outlined">
                                arrow_left_alt
                            </span>
                            <span>Back</span>
                        </button>

                        <button
                            type="submit"
                            disabled={submitting || loading}
                            className="ar-btn-green flex-1"
                        >
                            {submitting || loading ? "Loading..." : "Login"}
                        </button>
                    </div>

                    <div className="w-fit underline mt-10">
                        <Link href="/register">Register Instead</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
