"use client"

import axios from "@/config/axios";
import { fetchDataAtk, fetchDataReagen, permintaanActions } from "@/features/permintaanSlice";
import { useAuth } from "@/hooks/useAuth";
import { RootState } from "@/redux/store";
import { faPaperPlane } from "@fortawesome/free-regular-svg-icons";
import { faAdd, faCheckCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, Fragment, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncSelect from 'react-select/async';
import { toast } from "react-toastify";

export default function FormListPermintaan({ isAtk }: { isAtk?: boolean }) {
    const inventorySelectRef = useRef<any>(null)
    const formRef = useRef<any>(null)

    const dispatch = useDispatch<any>()

    const { user } = useAuth({ middleware: 'auth' })

    const [inventorySelected, setInventorySelected] = useState<ISelectBoxInventory | null>(null)
    const [jumlah, setJumlah] = useState<number>(1)
    const [tglPermintaan, setTglPermintaan] = useState<string>()
    const [description, setDescription] = useState<string>("")
    const [currentData, setCurrentData] = useState<any>()
    const [showRealisasiInput, setShowRealisasiInput] = useState(false)
    const [jumlahRealisasi, setJumlahRealisasi] = useState<any>([])

    const listInventory = useSelector((state: RootState) => state.permintaanReducer.listInventory)
    const isViewMode = useSelector((state: RootState) => state.permintaanReducer.isViewMode)
    const isEditMode = useSelector((state: RootState) => state.permintaanReducer.isEditMode)
    const dataReagen = useSelector((state: RootState) => state.permintaanReducer.dataReagen)
    const dataAtk = useSelector((state: RootState) => state.permintaanReducer.dataAtk)
    const currentDataId = useSelector((state: RootState) => state.permintaanReducer.currentDataId)

    interface ISelectBoxInventory {
        value: string,
        label: string,
        data: any
    }

    const loadReagenOptions = async (
        inputValue: string
    ): Promise<ISelectBoxInventory[]> => {

        if (inputValue) {
            const urlData = isAtk ? `api/barang-atk/getAll?name=${inputValue}` : `api/barang-reagen/getAll?name=${inputValue}`
            const { data } = await axios(urlData)

            const reagenOptions = data.map((item: any) => {
                const expired = item.expired !== null && new Date(item.expired).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) || '-'

                return {
                    value: item.id,
                    label: `${item.name} ${isAtk ? '- ( Stok: ' + item.stock + ' || Satuan: ' + item.satuan + ' )' : '- ( Stok: ' + item.stock + ' || Satuan: ' + item.satuan + ' || Ed: ' + expired + ' )'}`,
                    data: item
                }
            })

            return reagenOptions
        }
        return []
    };

    // SET TODAY
    useEffect(() => {
        let tglPermintaan = new Date()

        if (isViewMode || isEditMode) {
            const data = isAtk ? dataAtk.data.find((item: any) => item.id == currentDataId)
                : dataReagen.data.find((item: any) => item.id == currentDataId)

            setCurrentData(data)
            tglPermintaan = new Date(data.tgl_permintaan)
        }

        const year = tglPermintaan.getFullYear()
        const month = (`${tglPermintaan.getMonth() + 1}`).padStart(2, "0")
        const date = (`${tglPermintaan.getDate()}`).padStart(2, "0");

        const todayFormatted = `${year}-${month}-${date}`

        // SET TANGGAL PERMINTAAN SESUAI DATA YG SEDANG DILIHAT ATAU DIEDIT ATAU // SET DEFAULT TANGGAL KE HARI INI JIKA MODE CREATE
        setTglPermintaan(todayFormatted)

    }, [isViewMode, isEditMode, currentDataId, dataReagen, dataAtk, isAtk, currentData])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const form = formRef.current
        const formData = new FormData(form)
        formData.append('userFrontEnd', JSON.stringify(user.data))
        formData.append('inventory', JSON.stringify(listInventory))

        let url = `${isAtk ? 'api/permintaan-atk' : 'api/permintaan-reagen'}`

        if (isEditMode) {
            url = `${isAtk ? `api/permintaan-atk/${currentDataId}` : `api/permintaan-reagen/${currentDataId}`}`
            formData.append('_method', 'PATCH')
        }

        axios.post(url, formData)
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
                inventorySelectRef.current.clearValue();
                dispatch(permintaanActions.toggleForm())

                isAtk ?
                    dispatch(fetchDataAtk())
                    :
                    dispatch(fetchDataReagen())
            })
            .catch(({ response }) => {
                const error = response.data.msg  //PESAN ERROR MANUAL YANG DIHANDLE MANUAL DARI SERVER LARA
                if (error) {
                    toast.error(error, {
                        position: "top-right",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });
                    return
                }

                const errors = response.data.errors //ERROR YANG DIKIRIM AUTO DARI LARA

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

    const removeItemListHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id')

        dispatch(permintaanActions.substractList(id))
    }

    const closeFormHandler = () => {
        dispatch(permintaanActions.toggleForm())
        dispatch(permintaanActions.setIsViewMode(false))
        dispatch(permintaanActions.setIsEditMode(false))
        dispatch(permintaanActions.clearList())
    }

    const addToList = () => {
        if (inventorySelected === null) {
            toast.error('Silahkan pilih barang !', {
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

        // VALIDASI STOK APAKAH CUKUP ATAU TIDAK
        if (inventorySelected !== undefined) {

            const existingInventoryAdded = listInventory.find((item: any) => (item.barang?.id || item.atk.id) === inventorySelected.value)
            const existingInventoryAddedCount = existingInventoryAdded?.jumlahpermintaan || 0;

            const totalCount = existingInventoryAddedCount + jumlah;

            if (inventorySelected.data.stock < totalCount) {
                toast.error('Stok tidak cukup !', {
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

        dispatch(permintaanActions.addList({
            barang: inventorySelected?.data,
            jumlahpermintaan: jumlah,
            keterangan: description
        }))

        setJumlah(1)
        setInventorySelected(null)
        setDescription("")
    }

    const resetForm = () => {
        formRef.current.reset();
        dispatch(permintaanActions.clearList())
        setInventorySelected(null)
        setDescription("")
        setJumlah(1)
    }

    const validateAcc = () => {
        const position = user.data.position
        const status = currentData?.status.id

        const isAcc = (position === 'penyelia' && status >= 2)
            || (position === 'penyerah' && status >= 3)
            || (position === 'kasubbagumum' && status >= 4)

        if (isAcc) {
            toast.warning('Permintaan ini sudah disetujui.')
            return false
        }
        return true
    }

    const validateAccPenyerah = () => {
        const position = user.data.position
        const status = currentData?.status.id

        if (position === 'penyerah' && status <= 2) {
            // tampilkan input realisasi untuk penyerah saat menyetujui
            if (!showRealisasiInput) {
                setShowRealisasiInput(true)
                return false
            }

            // validasi realisasi tidak kosong
            const realisasiInputs = document.querySelectorAll<HTMLInputElement>('.realisasi')
            for (const element of realisasiInputs) {
                if (element.value === '' || element.value === '0') {
                    toast.error('Pastikan realisasi tidak kosong')
                    return false
                }
            }

        }

        return true
    }

    const accHandler = () => {
        if (!validateAcc()) {
            return //stop if validate not passed 
        }

        if (!validateAccPenyerah()) {
            return
        }

        axios.post(`/api/acc-permintaan/${currentDataId}`, { data: jumlahRealisasi })
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
                dispatch(permintaanActions.toggleForm())

                isAtk ?
                    dispatch(fetchDataAtk())
                    :
                    dispatch(fetchDataReagen())
            })
            .catch(({ response }) => {
                const error = response.data.msg  //PESAN ERROR MANUAL YANG DIHANDLE MANUAL DARI SERVER LARA
                if (error) {
                    toast.error(error, {
                        position: "top-right",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });
                    return
                }

                const errors = response.data.errors //ERROR YANG DIKIRIM AUTO DARI LARA

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

    const getListInventory = listInventory.map((item: any, index: number) => {
        const barang = item.barang || item.atk
        const expired = barang.expired
        const expiredFormatted = expired ? new Date(expired).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '-'

        return (
            <Fragment key={barang.id}>
                <li className="bg-teriary my-1 py-1 px-2 w-fit rounded">
                    {`${barang.name} (Stok: ${barang.stock})`}
                    {
                        !isViewMode && <span data-id={barang.id} className="text-red-600 ml-1" onClick={removeItemListHandler} role="button">
                            <FontAwesomeIcon icon={faTrash} />
                        </span>
                    }
                    <div className="text-xs [&>span]:mr-1">
                        <span className="bg-quaternary p-1">Jumlah Permintaan : {item.jumlahpermintaan}</span>
                        <span className="bg-quaternary p-1">Jumlah Realisasi : {item.jumlahrealisasi || '-'}</span>
                        <span className="bg-quaternary p-1">Satuan : {barang.satuan || '-'}</span>
                        <span className="bg-quaternary p-1">Expired : {expiredFormatted}</span>
                        <span className="bg-quaternary p-1">Ket : {item.keterangan || '-'}</span>
                    </div>

                    {
                        showRealisasiInput &&
                        <div>
                            <label htmlFor="realisasi">Realisasi : </label>
                            <input type="number" name="realisasi" min={0}
                                className="realisasi mt-2 rounded w-16 px-2 py-1"
                                onChange={(e: any) => setJumlahRealisasi((prev: any) => {
                                    const updatedArray = [...prev];
                                    updatedArray[index] = parseInt(e.target.value) || 0; // Use parseInt to convert to number
                                    return updatedArray;
                                })}
                            />
                        </div>
                    }
                </li>
            </Fragment>
        )
    })

    return (
        // modal
        <div className="fixed inset-0 bg-quaternary/90 flex items-center justify-center">
            {/* form container */}
            <div className="max-h-[calc(100vh-20px)] overflow-auto">
                <div className="p-6 bg-teriary rounded mx-2 w-[45rem]">
                    <form method="post" ref={formRef}>
                        <div className="flex">
                            <h2 className="flex-1 mb-4 text-xl sm:text-2xl md:text-3xl">{isViewMode ? 'Data' : isEditMode ? 'Edit' : 'Tambah'} Permintaan {isAtk ? 'ATK' : 'Reagen'}</h2>
                            <div className="flex flex-col mb-3 items-end">
                                <label htmlFor="created_at">Tanggal Permintaan</label>
                                <input
                                    type="date"
                                    id="created_at"
                                    name="created_at"
                                    className={`rounded p-2 mt-1 w-fit outline-none ${isViewMode ? 'bg-secondary' : ''}`}
                                    defaultValue={tglPermintaan}
                                    required
                                    readOnly={isViewMode ? true : false}
                                />
                            </div>
                        </div>
                    </form>

                    {
                        !isViewMode &&
                        <>
                            <div className="flex flex-col mb-3">
                                <label className="font-bold" htmlFor="barangs_id">Inventory</label>
                                <div className="flex">
                                    <AsyncSelect
                                        ref={inventorySelectRef}
                                        name={isAtk ? 'atk_id' : 'barangs_id'}
                                        className="mt-1 mr-2 flex-1"
                                        cacheOptions
                                        loadOptions={loadReagenOptions}
                                        defaultOptions
                                        isClearable
                                        required
                                        value={inventorySelected}
                                        onChange={(option: any) => setInventorySelected(option)}
                                    />
                                    <input type="number" name="jumlah" id="jumlah" title="Jumlah"
                                        className="mr-2 w-12 mt-1 rounded text-center"
                                        value={jumlah}
                                        min={1}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setJumlah(parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col mb-3">
                                <label className="font-bold" htmlFor="barangs_id">Keterangan</label>
                                <div className="flex">
                                    <textarea name="description" id="description" rows={2} placeholder="Baterai untuk jam aula besar"
                                        className="p-2 rounded flex-1 mr-2 mt-1"
                                        value={description}
                                        onChange={(e: any) => setDescription(e.target.value)}></textarea>
                                    <button type="button"
                                        className="bg-quaternary text-secondary rounded py-2 px-3 self-end shadow-md outline-none"
                                        onClick={addToList}
                                    ><FontAwesomeIcon icon={faAdd}></FontAwesomeIcon></button>
                                </div>
                            </div>
                        </>
                    }

                    <div className="list bg-secondary p-2 rounded">
                        <div className="flex items-end mb-2">
                            <h3 className="font-bold">Barang yang diminta : </h3>
                            {isViewMode && <span className="bg-blue-500 py-1 px-2 rounded text-white ml-auto">Status : {currentData?.status.name}</span>}
                        </div>
                        <ol className="list-decimal list-inside max-h-64 overflow-auto">
                            {
                                listInventory.length > 0 ?
                                    getListInventory :
                                    <span className="text-center text-teriary block">Belum ada barang</span>
                            }
                        </ol>
                    </div>
                    <div className="ml-6 mt-2">
                        <button
                            type="button"
                            className="bg-secondary text-quaternary px-3 py-2 mt-4 rounded shadow-md"
                            onClick={closeFormHandler}
                        >Tutup</button>
                        {!isViewMode && <button
                            type="button"
                            className="bg-quaternary text-secondary px-4 py-2 mt-4 mx-2 rounded shadow-md"
                            onClick={handleSubmit}
                        >
                            {/* <FontAwesomeIcon icon={faPaperPlane}></FontAwesomeIcon> */}
                            Simpan</button>
                        }
                        {(isViewMode && (user.data.position !== 'pemohon' && user.data.position !== null)) &&
                            <button
                                type="button"
                                className="bg-quaternary text-secondary px-4 py-2 mt-4 mx-2 rounded shadow-md"
                                onClick={accHandler}
                            ><FontAwesomeIcon icon={faCheckCircle}></FontAwesomeIcon> ACC</button>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}