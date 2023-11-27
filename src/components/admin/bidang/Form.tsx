"use client"

import axios from "@/config/axios";
import { bidangActions, fetchData } from "@/features/bidangSlice";
import { RootState } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncSelect from 'react-select/async';
import { toast } from "react-toastify";

export default function Form() {
    const data = useSelector((state: RootState) => state.bidangReducer.singleData)
    const dispatch = useDispatch<any>()

    interface iSelectBoxBidang {
        value: string,
        label: string
    }

    const loadKaTimOptions = async (
        inputValue: string
    ): Promise<iSelectBoxBidang[]> => {

        const urlData = `api/users?name=${inputValue}`
        const { data } = await axios(urlData)

        const options = data.data.map((item: any) => {
            return {
                value: item.id,
                label: item.name
            }
        })

        return options
    };

    const [selectedKaTim, setSelectedKaTim] = useState<any>()
    const [name, setName] = useState('')

    const formRef = useRef<any>(null)
    const kabidSelectRef = useRef<any>(null)

    useEffect(() => {
        // ISI FORM UNTUK EDITING
        if (data) {
            const currentBidang = { value: data?.kabid?.id, label: data?.kabid?.name }
            setSelectedKaTim(currentBidang)
            setName(data.name)
        }
    }, [data])

    const formResetter = () => {
        formRef.current.reset();
        kabidSelectRef.current.clearValue();
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const form = formRef.current
        const formData = new FormData(form)

        axios.post(`api/bidang`, formData)
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
            axios.post(`/api/bidang/${data.id}`, formData)
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
        dispatch(bidangActions.toggleForm());
        dispatch(bidangActions.setData(null))
    }


    return (
        // modal
        <div className="fixed top-0 right-0 left-0 h-screen bg-quaternary bg-opacity-90 flex items-center justify-center">
            <div className="max-h-screen">
                {/* form container */}
                <div className="p-6 bg-teriary rounded mx-2 w-[45rem] my-4">
                    <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl">Form Bidang</h2>
                    <form onSubmit={data ? handleUpdate : handleSubmit} ref={formRef}>

                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="kabid">KaTim</label>
                            <AsyncSelect
                                ref={kabidSelectRef}
                                name='kabid'
                                id='kabid'
                                className="mt-1"
                                cacheOptions
                                loadOptions={loadKaTimOptions}
                                defaultOptions
                                isClearable
                                required
                                value={selectedKaTim}
                                onChange={(option: any) => setSelectedKaTim(option)}
                            />
                        </div>
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="name">Nama Bidang</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="rounded p-2 mt-1"
                                placeholder="Contoh: Tata Usaha"
                                required
                                value={name}
                                onChange={(e: any) => setName(e.target.value)}
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