"use client"

import { atkActions } from "@/features/atkSlice"
import { RootState } from "@/redux/store"
import { useDispatch, useSelector } from "react-redux"
import Form from "./Form"
import Table from "./Table"
import { useAuth } from "@/hooks/useAuth"
import { useState } from "react"
import axios from "@/config/axios"
import { toast } from "react-toastify"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDownload, faSun } from "@fortawesome/free-solid-svg-icons"

export default function Index() {
    const isFormOpen = useSelector((state: RootState) => state.atkReducer.isFormOpen)

    const dispatch = useDispatch()

    const { user } = useAuth({ middleware: 'auth' })

    const [isLoading, setIsLoading] = useState(false)
    const downloadAtkHandler = () => {
        setIsLoading(true)
        axios({
            url: '/api/download-atk',
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                window.open(URL.createObjectURL(data));
                setIsLoading(false)
            })
            .catch(err => {
                toast.error('Terjadi kesalahan!')
                console.log(err)
                setIsLoading(false)
            })
    }

    return (
        <section className="p-4">
            <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Data ATK
            </h1>
            {(user.data.position === 'penyerah' || user.data.position === null) &&
                <button
                    className="bg-quaternary text-primary px-4 py-2 rounded"
                    onClick={() => dispatch(atkActions.toggleForm())}
                >
                    Tambah Data
                </button>
            }
            <div className="">
                {isLoading ?
                    <FontAwesomeIcon icon={faSun}
                        className="text-quaternary animate-spin p-2"
                        role="button"
                        size="xl"
                        spin
                    /> :
                    <FontAwesomeIcon icon={faDownload}
                        className="text-quaternary hover:animate-[bounce_1s_infinite_200ms] p-2"
                        role="button"
                        size="xl"
                        onClick={downloadAtkHandler}
                    />
                }
            </div>
            <Table
                url='/api/barang-atk'
                limit={0}
                isWithAction={(user.data.position === 'penyerah' || user.data.position === null) ? true : false}
            />
            {isFormOpen && <Form />}
        </section>
    )
}