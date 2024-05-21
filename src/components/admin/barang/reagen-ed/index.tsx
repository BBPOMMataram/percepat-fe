"use client"

import { bidangActions } from "@/features/bidangSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import Form from "./Form"
import Table from "./Table"
import { reagenActions } from "@/features/reagenSlice"
import { useAuth } from "@/hooks/useAuth"

export default function Index() {
    const isFormOpen = useSelector((state: RootState) => state.reagenReducer.isFormOpen)

    const dispatch = useDispatch()

    const { user } = useAuth({ middleware: 'auth' })

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Data Reagen ED
            </h1>
            
            <Table
                url='api/barang-reagen-expired'
                limit={0}
                isWithAction={false}
            />
        </section>
    )
}