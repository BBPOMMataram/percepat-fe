"use client"

import { userActions } from "@/features/userSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import FormUser from "./Form"
import TableUser from "./TableUser"

export default function User() {
    const isFormOpen = useSelector((state: RootState) => state.userReducer.isFormOpen)

    const dispatch = useDispatch()

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Pengguna
            </h1>
            <button
                className="bg-quaternary text-primary px-4 py-2 rounded"
                onClick={() => dispatch(userActions.toggleForm())}
            >
                Tambah Data
            </button>
            <TableUser
                url='api/users'
                limit={0}
            />
            {isFormOpen && <FormUser />}
        </section>
    )
}