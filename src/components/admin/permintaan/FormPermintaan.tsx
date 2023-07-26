"use client"

import axios from "@/config/axios";
import { fetchDataAtk, fetchDataReagen, penerimaanActions } from "@/features/penerimaanSlice";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import AsyncSelect from 'react-select/async';
import { ToastContainer, toast } from "react-toastify";

export default function FormPermintaan({ isAtk }: { isAtk?: boolean }) {
    const dispatch = useDispatch<any>()

    interface iSelectBoxReagen {
        value: string,
        label: string
    }

    const loadReagenOptions = async (
        inputValue: string
    ): Promise<iSelectBoxReagen[]> => {

        if (inputValue) {
            const urlData = isAtk ? `api/barang-atk/getAll?name=${inputValue}` : `api/barang-reagen/getAll?name=${inputValue}`
            const { data } = await axios(urlData)

            const reagenOptions = data.map((item: any) => {
                const expired = item.expired !== null && new Date(item.expired).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) || '-'

                return {
                    value: item.id,
                    label: `${item.name} ${isAtk ? '' : '(ed:' + expired + ' )'}`
                }
            })

            return reagenOptions
        }
        return []
    };

    const [today, setToday] = useState<string>()

    useEffect(() => {
        const today = new Date()

        const year = today.getFullYear()
        const month = (`${today.getMonth() + 1}`).padStart(2, "0")
        const date = (`${today.getDate()}`).padStart(2, "0");

        const todayFormatted = `${year}-${month}-${date}`

        setToday(todayFormatted) //UNTUK SET DEFAULT TANGGAL PENERIMAAN KE HARI INI
    }, [])

    const formRef = useRef<any>(null)
    const inventorySelectRef = useRef<any>(null)

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const form = formRef.current
        const formData = new FormData(form)

        axios.post(`${isAtk ? 'api/penerimaan-atk' : 'api/penerimaan-reagen'}`, formData)
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
                formRef.current.reset();
                inventorySelectRef.current.clearValue();

                isAtk ? 
                dispatch(fetchDataAtk())
                :
                dispatch(fetchDataReagen())
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
        <div className="fixed inset-0 bg-quaternary bg-opacity-90 flex items-center justify-center">
            <ToastContainer />
            {/* form container */}
            <div className="p-6 bg-teriary rounded mx-2 w-[45rem]">
                <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl">Form Penerimaan {isAtk ? 'ATK' : 'Reagen'}</h2>
                <form onSubmit={handleSubmit} method="post" ref={formRef}>
                    {/* input item */}
                    <div className="flex flex-col mb-3">
                        <label htmlFor="created_at">Tanggal Penerimaan</label>
                        <input
                            type="date"
                            id="created_at"
                            name="created_at"
                            className="rounded p-2 mt-1"
                            defaultValue={today}
                            required
                        />
                    </div>
                    {/* input item */}
                    <div className="flex flex-col mb-3">
                        <label htmlFor="barangs_id">Barang</label>
                        <AsyncSelect
                            ref={inventorySelectRef}
                            name={isAtk ? 'atk_id': 'barangs_id'}
                            className="mt-1"
                            cacheOptions
                            loadOptions={loadReagenOptions}
                            defaultOptions
                            isClearable
                            required
                        />
                    </div>
                    {/* input item */}
                    {isAtk ? null :
                        <div className="flex flex-col mb-3">
                            <label htmlFor="expired">Kedaluwarsa</label>
                            <input
                                type="date"
                                id="expired"
                                name="expired"
                                className="rounded p-2 mt-1"
                            />
                        </div>
                    }
                    {/* input item */}
                    <div className="flex flex-col mb-3">
                        <label htmlFor="jumlah">Jumlah</label>
                        <input
                            type="number"
                            id="jumlah"
                            name="jumlah"
                            className="rounded p-2 mt-1"
                            placeholder="Contoh: 100"
                            min={1}
                            required
                        />
                    </div>
                    {/* input item */}
                    <div className="flex flex-col mb-3">
                        <label htmlFor="vendor">Vendor</label>
                        <input
                            type="text"
                            id="vendor"
                            name="vendor"
                            className="rounded p-2 mt-1"
                            placeholder="Contoh: PT. Indonesia Raya"
                            required
                        />
                    </div>
                    <div className="w-full text-right">
                        <button
                            type="button"
                            className="bg-secondary text-quaternary px-4 py-2 mt-4 mx-2 rounded"
                            onClick={() => dispatch(penerimaanActions.toggleFormReagen())}
                        >Tutup</button>
                        <button
                            type="submit"
                            className="bg-quaternary text-primary font-bold px-4 py-2 mt-4 rounded"
                        >Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    )
}