"use client"

import { permintaanActions } from "@/features/permintaanSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import FormListPermintaan from "./FormListPermintaan"
import TablePermintaanReagen from "./TablePermintaanReagen"

export default function Reagen() {
    const isFormOpen = useSelector((state: RootState) => state.permintaanReducer.isFormOpen)

    const dispatch = useDispatch()

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Permintaan Reagen</h1>
            <button
                className="bg-quaternary text-primary px-4 py-2 rounded"
                onClick={() => {
                    dispatch(permintaanActions.toggleForm())
                }}
            >
                Tambah Data
            </button>
            
            <TablePermintaanReagen
                url='api/permintaan-reagen'
                limit={0}
                isSearchableName={false} // karena tidak ada nama yang jadi patokan
            />
            
            {isFormOpen && <FormListPermintaan />}
        </section>
    )
}