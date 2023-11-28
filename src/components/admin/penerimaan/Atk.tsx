"use client"

import { penerimaanActions } from "@/features/penerimaanSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import FormPenerimaan from "./FormPenerimaan"
import TablePenerimaanAtk from "./TablePenerimaanAtk"
import { useAuth } from "@/hooks/useAuth"

export default function Atk() {
    const isFormOpen = useSelector((state: RootState) => state.penerimaanReducer.isFormReagenOpen)

    const dispatch = useDispatch()

    const {user} = useAuth({middleware: 'auth'})

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">Penerimaan ATK</h1>
            {(user.data.position === 'penyerah' || user.data.position === null) &&
            <button
                className="bg-quaternary text-primary px-4 py-2 rounded"
                onClick={() => dispatch(penerimaanActions.toggleFormReagen())}
            >
                Tambah Data
            </button>
            }
            <TablePenerimaanAtk
                url='/api/penerimaan-atk'
                limit={0}
                isWithAction={(user.data.position === 'penyerah' || user.data.position === null) ? true : false}
            />
            {isFormOpen && <FormPenerimaan isAtk={true} />}
        </section>
    )
}