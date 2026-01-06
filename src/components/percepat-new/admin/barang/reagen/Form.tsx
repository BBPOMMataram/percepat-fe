"use client"

import axios from "@/config/axios";
import { fetchData, reagenActions } from "@/features/reagenSlice";
import { RootState } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function Form() {
    const data = useSelector((state: RootState) => state.reagenReducer.singleData)
    const dispatch = useDispatch<any>()

    const [name, setName] = useState('')
    const [satuan, setSatuan] = useState('')
    const [stock, setStock] = useState(0)
    const [expired, setExpired] = useState('')
    const [msds, setMsds] = useState('')

    const formRef = useRef<any>(null)

    useEffect(() => {
        // ISI FORM UNTUK EDITING
        if (data) {
            // FORMAT TANGGAL EXPIRED UNTUK DI SET KE INPUT DATE
            if (data.expired) {
                const [year, month, day] = data.expired.split(' ')[0].split('-')
                setExpired(`${year}-${month}-${day}`)
            }
            setName(data.name)
            setSatuan(data.satuan)
            setStock(data.stock)
            setMsds(data.msds)
        }
    }, [data])

    const formResetter = () => {
        formRef.current.reset();
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const form = formRef.current
        const formData = new FormData(form)

        axios.post(`api/barang-reagen`, formData)
            .then(({ data }) => {
                toast.success(data.msg, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });

                formResetter()
                dispatch(fetchData())
            })
            .catch(({ response }) => {
                const errors = response.data.errors

                // get all fields in errors as array
                const errorMessagesArray = Object.keys(errors)

                let autoCloseTime = 5000
                // loop all error fields exist
                errorMessagesArray.forEach(errorItem => {
                    // loop all items error each field
                    errors[errorItem].forEach((errorMessage: string) => {
                        toast.error(errorMessage, {
                            position: "top-right",
                            autoClose: autoCloseTime,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: "light",
                        });
                        autoCloseTime += 1000
                    });
                })
            })
    }

    const handleUpdate = async (e: any) => {
        e.preventDefault()

        const form = formRef.current
        const formData = new FormData(form)
        formData.append('_method', 'PUT')

        data &&
            axios.post(`/api/barang-reagen/${data.id}`, formData)
                .then(({ data }) => {
                    toast.success(data.msg, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });

                    dispatch(fetchData())
                    closeFormHandler();
                })
                .catch((response) => {
                    const errors = response.response.data.errors || response

                    // get all fields in errors as array
                    const errorMessagesArray = Object.keys(errors)

                    let autoCloseTime = 5000
                    // loop all error fields exist
                    errorMessagesArray.forEach(errorItem => {
                        // loop all items error each field
                        errors[errorItem].forEach((errorMessage: string) => {
                            toast.error(errorMessage, {
                                position: "top-right",
                                autoClose: autoCloseTime,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: "light",
                            });
                            autoCloseTime += 1000
                        });
                    })
                })
    }

    const closeFormHandler = () => {
        dispatch(reagenActions.toggleForm());
        dispatch(reagenActions.setSingleData(null))
    }

    return (
        // modal
        <div className="fixed top-0 right-0 left-0 h-screen bg-quaternary/90 flex items-center justify-center">
            <div className="max-h-screen">
                {/* form container */}
                <div className="p-6 bg-teriary rounded mx-2 w-[45rem] my-4">
                    <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl">Form Reagen</h2>
                    <form onSubmit={data ? handleUpdate : handleSubmit} ref={formRef}>

                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="name">Nama</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="rounded p-2 mt-1"
                                placeholder="Contoh: 2 BUTANOL"
                                required
                                value={name}
                                onChange={(e: any) => setName(e.target.value)}
                            />
                        </div>

                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="satuan">Satuan</label>
                            <input
                                type="text"
                                id="satuan"
                                name="satuan"
                                className="rounded p-2 mt-1"
                                placeholder="Contoh: 1 Liter"
                                required
                                value={satuan}
                                onChange={(e: any) => setSatuan(e.target.value)}
                            />
                        </div>

                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="stock">Stok</label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                className="rounded p-2 mt-1"
                                placeholder="Contoh: 78"
                                required
                                min={0}
                                value={stock}
                                onChange={(e: any) => setStock(e.target.value)}
                            />
                        </div>

                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="expired">Kedaluwarsa</label>
                            <input
                                type="date"
                                id="expired"
                                name="expired"
                                className="rounded p-2 mt-1"
                                value={expired}
                                onChange={(e: any) => setExpired(e.target.value)}
                            />
                        </div>

                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="msds">MSDS</label>
                            <input
                                type="text"
                                id="msds"
                                name="msds"
                                className="rounded p-2 mt-1"
                                placeholder="Inputkan link url"
                                value={msds}
                                onChange={(e: any) => setMsds(e.target.value)}
                            />
                        </div>

                        {/* BUTTONS */}
                        <div className="w-full text-right">
                            <button
                                type="button"
                                className="bg-secondary text-quaternary px-4 py-2 mt-4 mx-2 rounded"
                                onClick={closeFormHandler}
                            >Tutup</button>
                            <button
                                type="submit"
                                className="bg-quaternary text-primary font-bold px-4 py-2 mt-4 rounded"
                            >Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}