"use client"

import { fetchDataReagen, fetchListInventory, permintaanActions } from "@/features/permintaanSlice";
import { RootState } from "@/redux/store";
import { faBook, faCartFlatbedSuitcase, faClipboardList, faList, faList12, faListCheck, faListSquares, faPen, faPenClip, faThList, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingWithoutText from "../layouts/LoadingWithoutText";
import axios from "@/config/axios";
import { ToastContainer, toast } from "react-toastify";

interface iPermintaan {
    url: string,
    limit: number,
    title?: string,
    isWithAction?: boolean,
}

export default function TablePermintaanReagen({ url, limit, title, isWithAction = true }: iPermintaan) {
    const reagen = useSelector((state: RootState) => state.permintaanReducer.dataReagen)

    const [valuePerPage, setValuePerPage] = useState('5')
    const [nameToSearch, setNameToSearch] = useState('')
    const [delaySearch, setDelaySearch] = useState('') //AGAR BISA DIGUNAKAN DI USEEFFECT UNTUK TIMEOUT (DELAY)

    const dispatch = useDispatch<any>()

    useEffect(() => {
        const urlReagen = `${url}?value_per_page=${valuePerPage}&name=${nameToSearch}&page=${reagen?.current_page}&limit=${limit}`

        dispatch(fetchDataReagen(urlReagen))

        /// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valuePerPage, nameToSearch, reagen?.current_page, limit, url, dispatch])

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setDelaySearch(e.target.value)
    }

    // UNTUK DELAY SETNAMETOSEARCH 
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setNameToSearch(delaySearch)
        }, 1000)

        return () => {
            clearTimeout(timeoutId)
        }

    }, [delaySearch])


    const removeHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        if (id) {
            axios.delete(`/api/permintaan-reagen/${id}`)
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

                    dispatch(fetchDataReagen())
                })
                .catch(err => console.log(err))
        }
    }

    // MENGISI FORM UNTUK DIEDIT
    const editHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        dispatch(fetchListInventory(id))
        dispatch(permintaanActions.toggleForm())
    }

    const showListHandler = (e:any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        dispatch(fetchListInventory(id))
        dispatch(permintaanActions.toggleForm())
        dispatch(permintaanActions.setIsViewMode(true))
    }

    const addListHandler = (e:any) => {
        e.preventDefault()

        dispatch(permintaanActions.toggleForm())
    }

    const items = () => {
        let number = 1

        // HANDLE JIKA REAGEN TANPA LIMIT YAITU DATA SELURUHNYA MAKA ATUR NOMOR INDEX NYA PER HALAMAN, JIKA LIMIT ADA ABAIKAN INI
        if (reagen.data && reagen?.current_page !== 1) {
            number = (reagen?.current_page - 1) * parseInt(valuePerPage) + 1
        }

        const data = reagen?.data || reagen // DATA DENGAN ATAU TANPA LIMIT
        return data?.map((item: any, index: number) => {

            const tanggalPermintaan = item.tgl_permintaan ?
                new Date(item.tgl_permintaan).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                : '-'

            const tanggalPenyerahan = item.tgl_penyerahan ?
                new Date(item.tgl_penyerahan).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                : '-'

            return (
                <tr key={index}>
                    <td>{number++}</td>
                    <td>{item.peminta?.name}</td>
                    <td>{item.bidang?.name || '-'}</td>
                    <td>{item.bidang?.user?.name || '-'}</td>
                    <td>{item.status?.name}</td>
                    <td>{tanggalPermintaan}</td>
                    <td>{tanggalPenyerahan}</td>
                    {isWithAction &&
                        <td className="whitespace-nowrap [&>a]:mx-1 text-center">
                            <a href="#" data-id={item.id} onClick={showListHandler} title="List" className="list text-blue-800"><FontAwesomeIcon icon={faClipboardList} /></a>
                            <a href="#" data-id={item.id} onClick={editHandler} className="edit text-quaternary"><FontAwesomeIcon icon={faPen} /></a>
                            <a href="#" data-id={item.id} onClick={removeHandler} className="remove text-red-600"><FontAwesomeIcon icon={faTrash} /></a>
                        </td>
                    }
                </tr>
            )
        })
    }

    return !reagen ? <LoadingWithoutText />
        : (
            <>
                <ToastContainer />
                <div className="table-header flex items-end mt-3">
                    <h2 className="text-xl sm:text-2xl">
                        {title && <FontAwesomeIcon icon={faCartFlatbedSuitcase} flip="horizontal" />} <span>{title}</span>
                    </h2>
                    {
                        reagen.data &&
                        <select className="block p-2 [&>option]:p-2 rounded focus:outline-quaternary border border-quaternary bg-primary" name="value-per-page"
                            value={valuePerPage}
                            onChange={e => setValuePerPage(e.target.value)}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    }
                    <div className="search ml-auto">
                        <input type="text" className="p-2 border border-quaternary focus:outline-none rounded"
                            placeholder="Cari berdasarkan nama"
                            value={delaySearch}
                            onChange={handleSearch}
                            onClick={(e: any) => e.target.select()}
                        />
                    </div>
                </div>
                <table className="w-full border-collapse mt-2">
                    <thead className="[&_th]:border [&_th]:border-quaternary text-left">
                        <tr className="bg-secondary [&>th]:p-2">
                            <th>No</th>
                            <th>Yang Meminta</th>
                            <th>Bidang</th>
                            <th>KaTim / Penyelia</th>
                            <th>Status</th>
                            <th>Tanggal Permintaan</th>
                            <th>Tanggal Penyerahan</th>
                            {isWithAction &&
                                <th className="bg-black"></th>
                            }
                        </tr>
                    </thead>
                    <tbody className="[&_td]:border [&_td]:border-quaternary [&_td]:px-2 [&_td]:py-1">
                        {items()}
                    </tbody>
                </table>
                {
                    reagen.data &&
                    <div className="table-footer flex items-center">
                        <div className="grow">
                            {reagen?.links?.map((item: any, i: number) => {
                                let { url, label, active } = item

                                // remove words 'Previous' and 'Next'
                                label = label === '&laquo; Previous' ? "<"
                                    : label === 'Next &raquo;' ? '>' : label

                                let disabled = reagen.current_page === reagen.last_page && label === '>'
                                    || reagen.current_page === 1 && label === '<'


                                const isShowLink =
                                    label == '<' ||
                                    label == '>' ||
                                    label == '1' || //first page
                                    label == reagen.current_page ||
                                    // label == reagen.current_page + 1 ||
                                    // label == reagen.last_page - 1 ||
                                    label == reagen.last_page

                                return isShowLink ? (
                                    <Fragment key={i}>
                                        <button className={`p-2 rounded py-1 mx-[.1rem] my-2 ${active ? 'bg-teriary' : disabled ? 'bg-gray-200 text-gray-400' : 'bg-secondary '}`}
                                            dangerouslySetInnerHTML={{ __html: label }
                                            }
                                            onClick={() => dispatch(fetchDataReagen(url))}
                                            disabled={disabled}
                                        />
                                    </Fragment >
                                ) : (label >= reagen.current_page && label <= reagen.last_page) ? <span key={i} className="align-bottom">.</span>
                                    : null
                            })}
                        </div>
                        <div className="py-2 px-4 rounded bg-secondary">{`${reagen?.data?.length} dari ${reagen?.total} `}</div>
                    </div>
                }
            </>
        )
}