'use client'
import LoadingWithoutText from "@/components/percepat/admin/layouts/LoadingWithoutText";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PengajuanIfLoggedUserSiapMelayani from "./PengajuanIfLoggedUser";

export default function PengajuanPklSiapMelayani() {

    const dispatch = useDispatch<AppDispatch>()
    const { user, loading } = useSelector((state: RootState) => state.auth)

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    return loading ? <LoadingWithoutText /> :
        user ? <PengajuanIfLoggedUserSiapMelayani user={user} /> :
            <>
                <div className="max-w-4xl mx-auto my-6 bg-white shadow-md rounded-xl p-6 prose prose-slate">
                    <h1 className="text-2xl font-bold text-slate-800 mb-4">Halaman Pengajuan Mahasiswa PKL</h1>
                    <p>Halaman ini dikhususkan untuk data pengajuan PKL, Silahkan <b>login terlebih dahulu atau daftar</b> untuk mengakses halaman ini</p>
                </div>
            </>
}