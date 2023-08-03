"use client"

import axios from "@/config/axios";
import { penerimaanActions } from "@/features/penerimaanSlice";
import { fetchDataUser, userActions } from "@/features/userSlice";
import { ChangeEvent, ChangeEventHandler, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import AsyncSelect from 'react-select/async';
import { ToastContainer, toast } from "react-toastify";
import SignatureCanvas from "react-signature-canvas";

export default function Form() {
    const dispatch = useDispatch<any>()

    interface iSelectBoxBidang {
        value: string,
        label: string
    }

    const loadReagenOptions = async (
        inputValue: string
    ): Promise<iSelectBoxBidang[]> => {

        const urlData = `api/bidang?name=${inputValue}`
        const { data } = await axios(urlData)

        const options = data.data.map((item: any) => {
            return {
                value: item.id,
                label: item.name
            }
        })

        return options
    };

    const [position, setPosition] = useState<string>('')

    const formRef = useRef<any>(null)
    const kabidSelectRef = useRef<any>(null)
    const signatureSelectRef = useRef<any>(null)
    const positionSelectRef = useRef<any>(null)

    const formResetter = () => {
        formRef.current.reset();
        kabidSelectRef.current.clearValue();
        setPosition("")
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const form = formRef.current
        const formData = new FormData(form)

        formData.append('signature', signatureSelectRef.current.toDataURL())

        axios.post(`api/users`, formData)
            .then(({ data }) => {
                console.log(data);

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

                dispatch(fetchDataUser())
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

    return (
        // modal
        <div className="fixed top-0 right-0 left-0 h-screen bg-quaternary bg-opacity-90 flex items-center justify-center">
            <ToastContainer />
            <div className="max-h-screen overflow-auto">
                {/* form container */}
                <div className="p-6 bg-teriary rounded mx-2 w-[45rem] my-4">
                    <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl">Form Pengguna</h2>
                    <form onSubmit={handleSubmit} method="post" ref={formRef}>
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="bidang_id">Komoditi</label>
                            <AsyncSelect
                                ref={kabidSelectRef}
                                name='bidang_id'
                                id='bidang_id'
                                className="mt-1"
                                cacheOptions
                                loadOptions={loadReagenOptions}
                                defaultOptions
                                isClearable
                                required
                            />
                        </div>
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="name">Nama</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="rounded p-2 mt-1"
                                placeholder="Contoh: Muhammad Arfani Hidayat"
                                required
                            />
                        </div>
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="rounded p-2 mt-1"
                                placeholder="Contoh: arfanihidayat@gmail.com"
                                required
                            />
                        </div>
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="position">Posisi</label>
                            <select name="position" id="position"
                                className="p-2 rounded mt-1"
                                required
                                value={position}
                                onChange={(e:ChangeEvent<HTMLSelectElement>) => setPosition(e.target.value)}
                            >
                                <option value="">==Pilih Posisi==</option>
                                <option value="penyerah">Petugas Gudang</option>
                                <option value="penyelia">Kabid / Penyelia</option>
                                <option value="pemohon">Pemohon</option>
                                <option value="kasubbagumum">Ka. Sub. Bag. Umum</option>
                            </select>
                        </div>
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="photo">Foto</label>
                            <input
                                type="file"
                                id="photo"
                                name="photo"
                                className="mt-1"
                            />
                        </div>
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="signature">TTD</label>
                            <SignatureCanvas
                                penColor='orange'
                                canvasProps={{ className: 'bg-primary mt-1 w-72 h-52' }}
                                ref={signatureSelectRef}
                            />
                            <button type="button" onClick={() => signatureSelectRef.current.clear()}>clear</button>
                        </div>

                        {/* BUTTONS */}
                        <div className="w-full text-right">
                            <button
                                type="button"
                                className="bg-secondary text-quaternary px-4 py-2 mt-4 mx-2 rounded"
                                onClick={() => dispatch(userActions.toggleForm())}
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