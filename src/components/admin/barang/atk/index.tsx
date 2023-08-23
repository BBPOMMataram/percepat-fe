"use client"

import { atkActions } from "@/features/atkSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import Form from "./Form"
import Table from "./Table"

export default function Index() {
    const isFormOpen = useSelector((state: RootState) => state.atkReducer.isFormOpen)

    const dispatch = useDispatch()

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Data ATK
            </h1>
            <button
                className="bg-quaternary text-primary px-4 py-2 rounded"
                onClick={() => dispatch(atkActions.toggleForm())}
            >
                Tambah Data
            </button>
            <Table
                url='/api/barang-atk'
                limit={0}
            />
            {isFormOpen && <Form />}
        </section>
    )
}