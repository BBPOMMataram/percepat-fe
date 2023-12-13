"use client"

import axios from "@/config/axios";
import { fetchUsers, userActions } from "@/features/userSlice";
import { RootState } from "@/redux/store";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncSelect from 'react-select/async';
import SignatureCanvas from "react-signature-canvas";
import { toast } from "react-toastify";

export default function Form() {
    const data = useSelector((state: RootState) => state.userReducer.data)
    const dispatch = useDispatch<any>()

    interface iSelectBoxBidang {
        value: string,
        label: string
    }

    const loadBidangOptions = async (
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

    const [selectedBidang, setSelectedBidang] = useState<any>()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')

    const [position, setPosition] = useState('')

    const formRef = useRef<any>(null)
    const bidangSelectRef = useRef<any>(null)
    const signatureSelectRef = useRef<any>(null)

    useEffect(() => {
        if (data) {
            const currentBidang = { value: data?.bidang?.id, label: data?.bidang?.name }
            setSelectedBidang(currentBidang)
            setName(data.name)
            setEmail(data.email)
            setPosition(data.position)
        }
    }, [data])

    const formResetter = () => {
        formRef.current.reset();
        bidangSelectRef.current.clearValue();
        signatureSelectRef.current?.clear()
        setPosition("")
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const form = formRef.current
        const formData = new FormData(form)

        formData.append('signature', signatureSelectRef.current.toDataURL())

        axios.post(`api/users`, formData)
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
                dispatch(fetchUsers())
                closeFormHandler()
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

    const [updateSignPad, setUpdateSignPad] = useState(false)

    const handleUpdate = async (e: any) => {
        e.preventDefault()

        const form = formRef.current
        const formData = new FormData(form)
        formData.append('_method', 'PUT')

        if (updateSignPad) {
            formData.append('signature', signatureSelectRef.current.toDataURL())
            if (signatureSelectRef.current.isEmpty()) {
                toast.success('TTD dulu !', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });

                return
            }
        }

        data &&
            axios.post(`/api/users/${data.id}`, formData)
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

                    dispatch(fetchUsers())
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
        dispatch(userActions.toggleForm());
        dispatch(userActions.setData(null))
    }

    const resetPasswordHandler = () => {
        const dataBody = {
            _method: 'PATCH'
        }

        data &&
            axios.post(`/api/reset-password/${data.id}`, dataBody)
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

                    // dispatch(fetchUsers())
                    // closeFormHandler();
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

    return (
        // modal
        <div className="fixed top-0 right-0 left-0 h-screen bg-quaternary bg-opacity-90 flex items-center justify-center">
            <div className="max-h-screen overflow-auto">
                {/* form container */}
                <div className="p-6 bg-teriary rounded mx-2 w-[45rem] my-4">
                    <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl">Form Pengguna</h2>
                    <form onSubmit={data ? handleUpdate : handleSubmit} ref={formRef}>
                        <div className="font-light bg-secondary py-1 pr-4 pl-2 mr-1 inline-block border-l-4 border-l-red-400 mt-1 mb-2">
                            Password Default: <strong className="animate-pulse">password</strong>
                        </div>
                        {
                            // HANYA PADA MODE UPDATE
                            data &&
                            <button type="button" className="bg-red-600 px-2 py-1 text-red-100 rounded"
                                onClick={resetPasswordHandler}
                            >
                                Reset Password
                            </button>
                        }
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="bidang_id">Komoditi</label>
                            <AsyncSelect
                                ref={bidangSelectRef}
                                name='bidang_id'
                                id='bidang_id'
                                className="mt-1"
                                cacheOptions
                                loadOptions={loadBidangOptions}
                                defaultOptions
                                isClearable
                                required
                                value={selectedBidang}
                                onChange={(option: any) => setSelectedBidang(option)}
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
                                value={name}
                                onChange={(e: any) => setName(e.target.value)}
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
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                            />
                        </div>
                        {/* input item */}
                        <div className="flex flex-col mb-3">
                            <label htmlFor="position">Posisi</label>
                            <select name="position" id="position"
                                className="p-2 rounded mt-1"
                                required
                                value={position}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setPosition(e.target.value)}
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
                            <div className="preview-photo">
                                {data &&
                                    <>
                                        <Image
                                            src={data?.photo || '/assets/images/noimage.webp'}
                                            width={150}
                                            height={150}
                                            alt={`Foto profil ${data?.name}`}
                                        />
                                        <p className="text-red-600 w-fit border-l-2 border-quaternary pl-1 my-2">Browse untuk merubah foto</p>
                                    </>
                                }
                            </div>
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
                            {updateSignPad && <p className="text-red-600 animate-pulse">Note: Penuhkan batas atas dan bawah kotak</p>}
                            <div className="preview-signature">
                                {data &&
                                    <>
                                        {
                                            (!updateSignPad && data.signature) &&
                                            <Image
                                                src={data.signature}
                                                width={150}
                                                height={150}
                                                alt={`TTD ${data?.name}`}
                                                className="bg-white"
                                            />
                                        }
                                        <button
                                            type="button"
                                            onClick={() => setUpdateSignPad(!updateSignPad)}
                                            className="bg-secondary rounded px-2 py-1 my-2"
                                        >
                                            {updateSignPad ? 'Batal edit TTD' : 'Edit TTD'}
                                        </button>
                                    </>
                                }
                            </div>
                            {(!data || updateSignPad) ?
                                <>
                                    {updateSignPad && <p>TTD Baru</p>}
                                    <SignatureCanvas
                                        // penColor='orange'
                                        canvasProps={{ className: 'bg-primary mt-1 w-56 h-40' }}
                                        ref={signatureSelectRef}
                                    />
                                    <button className="mt-2 w-fit hover:underline text-red-600" type="button" onClick={() => signatureSelectRef.current.clear()}>
                                        Bersihkan
                                    </button>
                                </>
                                : null
                            }
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