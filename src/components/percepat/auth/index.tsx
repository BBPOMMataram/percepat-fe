"use client";

import { useEffect, useState } from "react";
import AuthForm from "./AuthForm";
import Loading from "../admin/layouts/Loading";

export default function LoginScreen() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // if (typeof window !== 'undefined') {
        setLoading(false)
        // }
    }, [loading])

    return loading ?
        <Loading /> :
        (
            <>
                <AuthForm mode="login" />
            </>
        )
}