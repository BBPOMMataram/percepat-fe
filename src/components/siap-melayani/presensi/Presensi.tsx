"use client";
import { showAlert } from "@/features/alertSlice";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PresensiCard from "./PresensiCard";
import PresensiTableSiapMelayani from "./PresensiTable";

export default function PresensiSiapMelayani() {
    const [dataPresensi, setDataPresensi] = useState<any>(null);

    const dispatch = useDispatch<AppDispatch>()

    const router = useRouter()

    const { user } = useSelector((state: RootState) => state.auth)

    const fetchDataPresensi = useCallback(async () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/presensi-pkl`)
            .then(res => {
                setDataPresensi(res?.data)
            })
            .catch(err => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                if (err.status == 403) {
                    router.push('/siap-melayani')
                }
            })
    }, [dispatch, router])

    useEffect(() => {
        fetchDataPresensi();
    }, [fetchDataPresensi])

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch])

    return (
        <>
            <PresensiCard
                checkInTime={dataPresensi?.check_in_time}
                checkOutTime={dataPresensi?.check_out_time}
                userName={user?.name || ""}
                onPresensiUpdated={fetchDataPresensi}
            />

            <PresensiTableSiapMelayani data={dataPresensi?.data_presensi?.data || []} />
        </>
    );
}
