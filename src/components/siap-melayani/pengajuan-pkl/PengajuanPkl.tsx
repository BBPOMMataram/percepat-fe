"use client";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PengajuanIfLoggedUserSiapMelayani from "./PengajuanIfLoggedUser";
import LoadingWithoutText from "@/components/main/loading/LoadingWithoutText";
import Link from "next/link";

export default function PengajuanPklSiapMelayani() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  return loading ? (
    <LoadingWithoutText />
  ) : user ? (
    <PengajuanIfLoggedUserSiapMelayani user={user} />
  ) : (
    <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-200/80 shadow-xs rounded-2xl p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-bpom-blue flex items-center justify-center mx-auto mb-4">
        <span className="material-symbols-outlined !text-[32px]">school</span>
      </div>
      <h1 className="text-2xl font-bold font-serif text-slate-800 mb-2">
        Halaman Pengajuan Mahasiswa PKL
      </h1>
      <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Halaman ini dikhususkan untuk data pengajuan Praktik Kerja Lapangan.
        Silakan masuk terlebih dahulu atau daftar akun baru untuk mengakses
        layanan ini.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/login?redirectUrl=/siap-melayani/pengajuan-pkl"
          className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
        >
          Masuk
        </Link>
        <Link
          href="/register?redirectUrl=/siap-melayani/pengajuan-pkl"
          className="px-6 py-2.5 rounded-xl bg-bpom-blue text-white font-medium text-sm hover:bg-bpom-blue/90 shadow-xs transition-all"
        >
          Daftar Akun
        </Link>
      </div>
    </div>
  );
}
