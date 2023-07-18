"use client"

import { penerimaanActions } from "@/features/penerimaanSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import FormPenerimaan from "./FormPenerimaan"
import TablePenerimaanReagen from "./TablePenerimaanReagen"

export default function Reagen() {
    const isFormOpen = useSelector((state: RootState) => state.penerimaanReducer.isFormReagenOpen)

    const dispatch = useDispatch()

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">Penerimaan Reagen</h1>
            <button
                className="bg-quaternary text-primary px-4 py-2 rounded"
                onClick={() => dispatch(penerimaanActions.toggleFormReagen())}
            >
                Tambah Data
            </button>
            <TablePenerimaanReagen
                url='/api/penerimaan-reagen'
            />
            {isFormOpen && <FormPenerimaan />}
        </section>
    )
}