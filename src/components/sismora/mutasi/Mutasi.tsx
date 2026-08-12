"use client";

import { usePathname, useRouter } from "next/navigation";
import ListMutations from "./ListMutations";
import FormMutation from "./FormMutation";

export default function Mutasi() {
    const pathname = usePathname();
    const router = useRouter();

    const isForm = pathname.startsWith("/sismora/mutasi/form");
    const isList = pathname === "/sismora/mutasi";

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800 uppercase">Mutasi Ruangan</h1>

            {isList && <ListMutations />}
            {isForm && <FormMutation />}
        </div>
    );
}
