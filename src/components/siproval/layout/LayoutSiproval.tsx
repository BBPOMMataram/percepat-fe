"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { RootState, AppDispatch } from "@/redux/store";
import { getUser } from "@/features/authSlice";

export default function LayoutSiproval({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading } = useSelector((state: RootState) => state.auth);
    
    const router = useRouter();
    const pathname = usePathname();

    // Panggil getUser untuk mengecek sesi aktif saat Siproval diakses
    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    // Logika Pengalihan (Route Guard & Otorisasi Aktor)
    useEffect(() => {
        // Jika loading selesai dan user tidak ada, arahkan ke login
        if (loading === false && !user) {
            router.push(`/login?redirectUrl=${pathname}`);
            return;
        }

        if (loading === false && user) {
            const isSuperadmin =
                user.role?.level === "superadmin" ||
                (user.role?.level === "admin" &&
                    Array.isArray(user.sites) &&
                    user.sites.some(
                        (s: { id?: number; name?: string }) =>
                            Number(s?.id) === 3 || s?.name?.toLowerCase().includes("siproval")
                    )) ||
                user.email === "hilmi.khairan@pom.go.id";
            const groupJabatanId = user.employee?.group_jabatan_id;
            const isKatimFromTable = Array.isArray(user.katims) && user.katims.length > 0;
            const isKatim = groupJabatanId === 3 || isKatimFromTable;

            // Jika bukan superadmin / PIC Siproval, batasi akses berdasarkan group_jabatan & tabel katims
            if (!isSuperadmin) {
                // Di landing portal /siproval tetap diizinkan
                if (pathname === "/siproval") {
                    return;
                }

                // Rute fitur TU (Dashboard TU, Realisasi RO, Budget Mapping) terbuka di local
                const isTuPath =
                    pathname.startsWith("/siproval/tu") ||
                    pathname.startsWith("/siproval/budget-mapping");

                // Katim (group_jabatan_id == 3 atau terdaftar di tabel katims)
                if (isKatim) {
                    const isAllowed =
                        pathname.startsWith("/siproval/katim") ||
                        pathname.startsWith("/siproval/google-sheets") ||
                        isTuPath;
                    if (!isAllowed) {
                        router.push("/siproval/katim");
                    }
                }
                // Kabalai (group_jabatan_id == 1)
                else if (groupJabatanId === 1) {
                    const isAllowed =
                        pathname.startsWith("/siproval/monev") ||
                        pathname.startsWith("/siproval/show-monev") ||
                        pathname.startsWith("/siproval/catatan") ||
                        pathname.startsWith("/siproval/rhpk") ||
                        pathname.startsWith("/siproval/arahan-pimpinan") ||
                        isTuPath;
                    if (!isAllowed) {
                        router.push("/siproval/monev");
                    }
                }
                // TU (group_jabatan_id == 2)
                else if (groupJabatanId === 2) {
                    const isAllowed =
                        isTuPath ||
                        pathname === "/siproval";
                    if (!isAllowed) {
                        router.push("/siproval/tu");
                    }
                }
                // Staf (4), OS (5), dll
                else {
                    if (!isTuPath) {
                        router.push("/unauthorized");
                    }
                }
            }
        }
    }, [user, loading, router, pathname]);

    // Tampilkan loading spinner selama proses pengecekan atau jika user kosong
    if (loading || !user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                <span className="loading loading-spinner loading-lg text-emerald-600"></span>
            </div>
        );
    }

    // Jika user ada (sudah login), render halaman Siproval
    return (
        <div className="min-h-screen font-sans">
            {children}
        </div>
    );
}