"use client"

import axios from "@/config/axios";
import { fetchDataAtk, fetchDataReagen, penerimaanActions } from "@/features/penerimaanSlice";
import { RootState } from "@/redux/store";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncSelect from 'react-select/async';
import { toast } from "react-toastify";

export default function FormPenerimaan({ isAtk }: { isAtk?: boolean }) {
    const dispatch = useDispatch<any>()

    interface iSelectBoxReagen {
        value: string,
        label: string
    }

    const loadReagenOptions = async (
        inputValue: string
    ): Promise<iSelectBoxReagen[]> => {

        if (inputValue) {
            const urlData = isAtk ? `api/barang-atk/getAll?name=${inputValue}`
                : `api/barang-reagen/getAll?name=${inputValue}`

            const { data } = await axios(urlData)

            const reagenOptions = data.map((item: any) => {
                const expired = item.expired !== null && new Date(item.expired).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) || '-'

                return {
                    value: item.id,
                    label: `${item.name} ${isAtk ? '- ( Stok: ' + item.stock + ' || Satuan: ' + item.satuan + ' )' : '- ( Stok: ' + item.stock + ' || Satuan: ' + item.satuan + ' || Ed: ' + expired + ' )'}`,
                }
            })

            return reagenOptions
        }
        return []
    };

    const [tglPenerimaan, setTglPenerimaan] = useState("")
    const [selectedInventory, setSelectedInventory] = useState<any>()
    const [kedaluwarsa, setKedaluwarsa] = useState("")
    const [jumlah, setJumlah] = useState(0)
    const [vendor, setVendor] = useState("")

    const data = useSelector((state: RootState) => state.penerimaanReducer.singleData)

    useEffect(() => {
        // ISI FORM UNTUK EDITING
        if (data) {

            if (data.expired) {
                const currentKedaluwarsa = new Date(data.expired)

                const year = currentKedaluwarsa.getFullYear()
                const month = (`${currentKedaluwarsa.getMonth() + 1}`).padStart(2, "0")
                const date = (`${currentKedaluwarsa.getDate()}`).padStart(2, "0");

                const currentKedaluwarsaFormatted = `${year}-${month}-${date}`

                setKedaluwarsa(currentKedaluwarsaFormatted)
            }

            const currentTglPenerimaan = new Date(data.created_at)

            const year = currentTglPenerimaan.getFullYear()
            const month = (`${currentTglPenerimaan.getMonth() + 1}`).padStart(2, "0")
            const date = (`${currentTglPenerimaan.getDate()}`).padStart(2, "0");

            const currentTglPenerimaanFormatted = `${year}-${month}-${date}`

            setTglPenerimaan(currentTglPenerimaanFormatted)

            // jika reagen nama nya 'barang', sedangkan atk namanya 'atk'
            let inventorySelected =null;
            if(data.barang){
                inventorySelected = { value: data.barang.id, label: data.barang.name }
            }else if(data.atk){
                inventorySelected = { value: data.atk.id, label: data.atk.name }
            }
            setSelectedInventory(inventorySelected)
            
            setJumlah(data.jumlah)
            setVendor(data.vendor)
        }
    }, [data])

    useEffect(() => {
        const today = new Date()

        const year = today.getFullYear()
        const month = (`${today.getMonth() + 1}`).padStart(2, "0")
        const date = (`${today.getDate()}`).padStart(2, "0");

        const todayFormatted = `${year}-${month}-${date}`

        setTglPenerimaan(todayFormatted) //UNTUK SET DEFAULT TANGGAL PENERIMAAN KE HARI INI
    }, [])

    const formRef = useRef<any>(null)
    const inventorySelectRef = useRef<any>(null)

    const resetForm = () => {
        setVendor("")
        setJumlah(0)
        inventorySelectRef.current.clearValue();

        let today = new Date()

        const year = today.getFullYear()
        const month = (`${today.getMonth() + 1}`).padStart(2, "0")
        const date = (`${today.getDate()}`).padStart(2, "0");

        const todayFormatted = `${year}-${month}-${date}`

        setTglPenerimaan(todayFormatted)
        setKedaluwarsa("")
    }

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
                resetForm()
                dispatch(penerimaanActions.toggleFormReagen());

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

    const handleUpdate = async (e: any) => {
        e.preventDefault()
        const form = formRef.current
        const formData = new FormData(form)
        formData.append('_method', 'PUT')

        data &&
            axios.post(`${isAtk ? 'api/penerimaan-atk/' + data.id : 'api/penerimaan-reagen/' + data.id}`, formData)
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
                    dispatch(penerimaanActions.toggleFormReagen());
                    dispatch(penerimaanActions.setSingleDataReagen(null))
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
            {/* form container */}
            <div className="p-6 bg-teriary rounded mx-2 w-[45rem]">
                <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl">Form Penerimaan {isAtk ? 'ATK' : 'Reagen'}</h2>
                <form onSubmit={data ? handleUpdate : handleSubmit} method="post" ref={formRef}>
                    {/* input item */}
                    <div className="flex flex-col mb-3">
                        <label htmlFor="created_at">Tanggal Penerimaan</label>
                        <input
                            type="datetime-local"
                            id="created_at"
                            name="created_at"
                            className="rounded p-2 mt-1"
                            required
                            value={tglPenerimaan}
                            onChange={(e) => setTglPenerimaan(e.target.value)}
                        />
                    </div>
                    {/* input item */}
                    <div className="flex flex-col mb-3">
                        <label htmlFor="barangs_id">Barang</label>
                        <AsyncSelect
                            ref={inventorySelectRef}
                            name={isAtk ? 'atk_id' : 'barangs_id'}
                            className="mt-1"
                            cacheOptions
                            loadOptions={loadReagenOptions}
                            defaultOptions
                            isClearable
                            required
                            value={selectedInventory}
                            onChange={(option: any) => setSelectedInventory(option)}
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
                                value={kedaluwarsa}
                                onChange={(e: any) => setKedaluwarsa(e.target.value)}
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
                            value={jumlah}
                            onChange={(e: any) => setJumlah(e.target.value)}
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
                            value={vendor}
                            onChange={(e: any) => setVendor(e.target.value)}
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