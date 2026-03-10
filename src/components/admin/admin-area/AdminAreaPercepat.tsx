"use client"
import FooterUserArea from "@/components/main/user-area/Footer";
import HeaderUserArea from "@/components/main/user-area/Header";
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminPercepat from "../percepat/AdminPercepat";
import AdminMasterAtkPercepat from "../percepat/master/atk/AdminMasterAtkPercepat";
import AdminMasterPerlengkapanPercepat from "../percepat/master/perlengkapan/AdminMasterPerlengkapanPercepat";
import AdminMasterReagenPercepat from "../percepat/master/reagen/AdminMasterReagenPercepat";
import AdminAtkPercepat from "../percepat/permintaan/atk/AdminAtkPercepat";
import AdminPermintaanPerlengkapanPercepat from "../percepat/permintaan/perlengkapan/AdminPermintaanPerlengkapanPercepat";
import AdminPermintaanReagenPercepat from "../percepat/permintaan/reagen/AdminPermintaanReagenPercepat";
import AdminSettingsPercepat from "../percepat/settings/AdminSettingsPercepat";
import SidebarAdminPercepat from "./sidebar/SidebarAdminPercepat";
import AdminPenerimaanReagenPercepat from "../percepat/penerimaan/reagen/AdminPenerimaanReagenPercepat";

export default function AdminAreaPercepat() {
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
            // admin jika role level admin DAN memiliki salah satu site dengan id = 1 (site percepat)
            const isAdminThisSite = Array.isArray(user.sites) && user.sites.some((s: any) => Number(s?.id) === 1)
            const isAdmin = user.role?.level === 'admin' && isAdminThisSite
            if (!isAdmin && !isSuperadmin) {
                router.replace('/unauthorized');
            }
        }
    }, [user, router]);

    return (
        <main className="flex h-screen bg-gray-100 w-full">
            <SidebarAdminPercepat />
            <div className="flex-1 flex flex-col w-[calc(100%-4rem)] lg:w-[calc(100%-13rem)]">
                <HeaderUserArea user={user} callName={callName} />
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* ADMIN DASHBOARD PANEL */}
                    {
                        pathname === '/admin/percepat' && user &&
                        <AdminPercepat />
                    }
                    {/* MASTER */}
                    {
                        pathname === '/admin/percepat/master/reagen' && user &&
                        <AdminMasterReagenPercepat />
                    }
                    {
                        pathname === '/admin/percepat/master/atk' && user &&
                        <AdminMasterAtkPercepat />
                    }
                    {
                        pathname === '/admin/percepat/master/perlengkapan' && user &&
                        <AdminMasterPerlengkapanPercepat />
                    }
                    {/* PERMINTAAN */}
                    {
                        pathname === '/admin/percepat/permintaan/reagen' && user &&
                        <AdminPermintaanReagenPercepat />
                    }
                    {
                        pathname === '/admin/percepat/permintaan/atk' && user &&
                        <AdminAtkPercepat />
                    }
                    {
                        pathname === '/admin/percepat/permintaan/perlengkapan' && user &&
                        <AdminPermintaanPerlengkapanPercepat />
                    }
                    {/* PENERIMAAN */}
                    {
                        pathname === '/admin/percepat/penerimaan/reagen' && user &&
                        <AdminPenerimaanReagenPercepat />
                    }
                    {
                        pathname === '/admin/percepat/penerimaan/atk' && user &&
                        <AdminAtkPercepat />
                    }
                    {
                        pathname === '/admin/percepat/penerimaan/perlengkapan' && user &&
                        <AdminPermintaanPerlengkapanPercepat />
                    }


                    {
                        pathname === '/admin/percepat/settings' && user &&
                        <AdminSettingsPercepat user={user} />
                    }
                    <FooterUserArea />
                </div>
            </div>
        </main>
    );
}
