"use client"
import AdminSiapMelayani from "@/components/admin/siap-melayani/AdminSiapMelayani";
import FooterUserArea from "@/components/main/user-area/Footer";
import HeaderUserArea from "@/components/main/user-area/Header";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminElearningSiapMelayani from "../siap-melayani/e-learning/AdminElearningSiapMelayani";
import AdminSettingsSiapMelayani from "../siap-melayani/settings/AdminSettingsSiapMelayani";
import AdminPaktaIntegritasSiapMelayani from "../siap-melayani/pakta-integritas/AdminPaktaIntegritasSiapMelayani";
import AdminPenempatanSiapMelayani from "../siap-melayani/penempatan/AdminPenempatanSiapMelayani";
import AdminPengajuanSiapMelayani from "../siap-melayani/pengajuan/AdminPengajuanSiapMelayani";
import AdminPesertaSiapMelayani from "../siap-melayani/peserta/AdminPesertaSiapMelayani";
import AdminPresensiSiapMelayani from "../siap-melayani/presensi/AdminPresensiSiapMelayani";
import AdminTataTertibSiapMelayani from "../siap-melayani/tata-tertib/AdminTataTertibSiapMelayani";
import SidebarAdminSiapMelayani from "./sidebar/SidebarAdminSiapMelayani";

export default function AdminAreaSiapMelayani() {
    const [callName, setCallName] = useState<string>("");

    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>()
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        dispatch(getUser())
    }, [dispatch])

    // CALL NAME DIPISAH KARENA SAAT USER KETIK DI KOLOM INPUT CALL NAME MAKA DI HEADER NYA JUGA IKUT TERUBAH
    useEffect(() => {
        if (user) {
            setCallName(user.call_name || "");
            const isSuperadmin = user.role?.level === 'superadmin'
            // admin jika role level admin DAN memiliki salah satu site dengan id = 10 (site siap melayani)
            const hasBestEmployeeSite = Array.isArray(user.sites) && user.sites.some((s: any) => Number(s?.id) === 10)
            const isAdmin = user.role?.level === 'admin' && hasBestEmployeeSite
            if (!isAdmin && !isSuperadmin) {
                router.replace('/unauthorized');
            }
        }
    }, [user]);

    return (
        <main className="flex h-screen bg-gray-100 w-full">
            <SidebarAdminSiapMelayani />
            <div className="flex-1 flex flex-col w-[calc(100%-4rem)] lg:w-[calc(100%-13rem)]">
                <HeaderUserArea user={user} callName={callName} />
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* ADMIN DASHBOARD PANEL */}
                    {
                        pathname === '/admin/siap-melayani' && user &&
                        <AdminSiapMelayani />
                    }
                    {/* OTHERS */}
                    {
                        pathname === '/admin/siap-melayani/peserta' && user &&
                        <AdminPesertaSiapMelayani />
                    }
                    {
                        pathname === '/admin/siap-melayani/presensi' && user &&
                        <AdminPresensiSiapMelayani />
                    }
                    {
                        pathname === '/admin/siap-melayani/penempatan' && user &&
                        <AdminPenempatanSiapMelayani />
                    }
                    {
                        pathname === '/admin/siap-melayani/pengajuan' && user &&
                        <AdminPengajuanSiapMelayani />
                    }
                    {
                        pathname === '/admin/siap-melayani/tata-tertib' && user &&
                        <AdminTataTertibSiapMelayani />
                    }
                    {
                        pathname === '/admin/siap-melayani/e-learning' && user &&
                        <AdminElearningSiapMelayani />
                    }
                    {
                        pathname === '/admin/siap-melayani/pakta-integritas' && user &&
                        <AdminPaktaIntegritasSiapMelayani />
                    }
                    {
                        pathname === '/admin/siap-melayani/settings' && user &&
                        <AdminSettingsSiapMelayani user={user} />
                    }
                    <FooterUserArea />
                </div>
            </div>
        </main>
    );
}
