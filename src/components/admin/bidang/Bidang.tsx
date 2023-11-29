"use client"

import { bidangActions } from "@/features/bidangSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import Form from "./Form"
import Table from "./Table"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Bidang() {
    const isFormOpen = useSelector((state: RootState) => state.bidangReducer.isFormOpen)

    const dispatch = useDispatch()

    const router = useRouter()

    const { user } = useAuth({ middlware: 'auth' })

    useEffect(() => {
        if (user.data.position !== 'penyerah' && user.data.position !== 'kasubbagumum' && user.data.position !== null) {
            router.push('/login')
        }
    })

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Bidang
            </h1>
            {(user.data.position === 'penyerah' || user.data.position === null) &&
                <button
                    className="bg-quaternary text-primary px-4 py-2 rounded"
                    onClick={() => dispatch(bidangActions.toggleForm())}
                >
                    Tambah Data
                </button>
            }
            <Table
                url='api/bidang'
                limit={0}
                isWithAction={(user.data.position === 'penyerah' || user.data.position === null) ? true : false}
            />
            {isFormOpen && <Form />}
        </section>
    )
}