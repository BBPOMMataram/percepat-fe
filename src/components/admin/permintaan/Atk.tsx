"use client"

import { permintaanActions } from "@/features/permintaanSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import FormListPermintaan from "./FormListPermintaan"
import TablePermintaanAtk from "./TablePermintaanAtk"
import { useAuth } from "@/hooks/useAuth"

export default function Atk() {
    const isFormOpen = useSelector((state: RootState) => state.permintaanReducer.isFormOpen)

    const dispatch = useDispatch()

    const { user } = useAuth({ middleware: 'auth' })

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Permintaan ATK
            </h1>
            {(user.data.position === 'pemohon') &&
                <button
                    className="bg-quaternary text-primary px-4 py-2 rounded"
                    onClick={() => dispatch(permintaanActions.toggleForm())}
                >
                    Tambah Data
                </button>
            }
            <TablePermintaanAtk
                url='api/permintaan-atk'
                limit={0}
                isSearchableName={false}
            />

            {isFormOpen && <FormListPermintaan isAtk={true} />}
        </section>
    )
}