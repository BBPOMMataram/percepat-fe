"use client"

import axios from "@/config/axios";
import {  fetchUsers, userActions } from "@/features/userSlice";
import { RootState } from "@/redux/store";
import { faCartFlatbedSuitcase, faLink, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import LoadingWithoutText from "../../layouts/LoadingWithoutText";
import { reagenActions, fetchData, fetchSingleData } from "@/features/reagenSlice";

interface ITableProps {
    url: string,
    limit: number,
    title?: string,
}

export default function Table({ url, limit, title }: ITableProps) {
    const data = useSelector((state: RootState) => state.reagenReducer.data)

    const [valuePerPage, setValuePerPage] = useState('5')
    const [nameToSearch, setNameToSearch] = useState('')
    const [delaySearch, setDelaySearch] = useState('') //AGAR BISA DIGUNAKAN DI USEEFFECT UNTUK TIMEOUT (DELAY)

    const dispatch = useDispatch<any>()

    // PASTIKAN META ADA PADA DATA ATAU SET KOSONG (TYPESCRIPT)
    const currentPage = data && 'meta' in data ? data?.meta?.current_page : ''
    const urlToFetch = `${url}?value_per_page=${valuePerPage}&name=${nameToSearch}&page=${currentPage}&limit=${limit}`

    useEffect(() => {
        dispatch(fetchData(urlToFetch))
        /// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valuePerPage, nameToSearch, dispatch, urlToFetch])

    // UNTUK DELAY SETNAMETOSEARCH 
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setNameToSearch(delaySearch)
        }, 1000)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [delaySearch])

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setDelaySearch(e.target.value)
    }

    const removeHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        if (id) {
            axios.delete(`/api/barang-reagen/${id}`)
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
                })
                .catch(err => console.log(err))
        }
    }

    // MENGISI FORM UNTUK DIEDIT
    const editHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        //BUAT DISINI KALO EXPIRED DATE NYA ADA MAKA SET DENGAN NEW DATE(E.TARGET.VALUE)
        if (id) {
            dispatch(fetchSingleData(id))
            dispatch(reagenActions.toggleForm())
        }
    }

    const tableHeaderFields =
        <tr className="bg-secondary [&>th]:p-2">
            <th>No</th>
            <th>Nama</th>
            <th>Satuan</th>
            <th>Stok</th>
            <th>Kedaluwarsa</th>
            <th>MSDS</th>
            <th className="bg-black"></th>
        </tr>

    const dataTable = () => {
        let number = 1

        // HANDLE JIKA REAGEN TANPA LIMIT YAITU DATA SELURUHNYA MAKA ATUR NOMOR INDEX NYA PER HALAMAN, JIKA LIMIT ADA ABAIKAN INI
        if (data && 'meta' in data && data?.meta?.current_page !== 1) {
            number = (data?.meta?.current_page - 1) * parseInt(valuePerPage) + 1
        }

        return data?.data?.map((item: any, index: number) => {
            const expiredDate = item.expired ? new Date(item.expired).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '-'
            const msds = item.msds ? <a href={item.msds} target="_blank"><FontAwesomeIcon icon={faLink} /></a> : '-';
            
            return (
                <tr key={index}>
                    <td>{number++}</td>
                    <td>{item.name}</td>
                    <td>{item.satuan}</td>
                    <td>{item.stock}</td>
                    <td>{expiredDate}</td>
                    <td className="text-center">{msds}</td>
                    <td className="whitespace-nowrap [&>a]:mx-1 text-center">
                        <a href="#" data-id={item.id} onClick={removeHandler} className="remove text-red-600"><FontAwesomeIcon icon={faTrash} /></a>
                        <a href="#" data-id={item.id} onClick={editHandler} className="edit text-quaternary"><FontAwesomeIcon icon={faPen} /></a>
                    </td>
                </tr>
            )
        })
    }

    return !data ? <LoadingWithoutText />
        : (
            <>
                <ToastContainer />
                <div className="table-header flex items-end mt-3">
                    <h2 className="text-xl sm:text-2xl">
                        {title && <FontAwesomeIcon icon={faCartFlatbedSuitcase} flip="horizontal" />} <span>{title}</span>
                    </h2>
                    {
                        data.data &&
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
                        {tableHeaderFields}
                    </thead>
                    <tbody className="[&_td]:border [&_td]:border-quaternary [&_td]:px-2 [&_td]:py-1">
                        {dataTable()}
                    </tbody>
                </table>
                {
                    data.data &&
                    <div className="table-footer flex items-center">
                        <div className="grow">
                            {'meta' in data && data?.meta?.links?.map((item: any, i: number) => {
                                let { url, label, active } = item

                                // remove words 'Previous' and 'Next'
                                label = label === '&laquo; Previous' ? "<"
                                    : label === 'Next &raquo;' ? '>' : label

                                // DISABLE PREV OR NEXT BUTTON IF STUCK
                                let disabled = data.meta?.current_page === data.meta?.last_page && label === '>'
                                    || data.meta?.current_page === 1 && label === '<'


                                const isShowLink =
                                    label == '<' ||
                                    label == '>' ||
                                    label == '1' || //first page
                                    label == data.meta?.current_page ||
                                    // label == data.meta?.current_page + 1 ||
                                    // label == data.last_page - 1 ||
                                    label == data.meta?.last_page

                                return isShowLink ? (
                                    <Fragment key={i}>
                                        <button className={`p-2 rounded py-1 mx-[.1rem] my-2 ${active ? 'bg-teriary' : disabled ? 'bg-gray-200 text-gray-400' : 'bg-secondary '}`}
                                            dangerouslySetInnerHTML={{ __html: label }
                                            }
                                            onClick={() => dispatch(fetchData(url))}
                                            disabled={disabled}
                                        />
                                    </Fragment >
                                ) : (label >= data.meta?.current_page && label <= data.meta?.last_page) ? <span key={i} className="align-bottom">.</span>
                                    : null
                            })}
                        </div>
                        <div className="py-2 px-4 rounded bg-secondary">{`${data?.data?.length} dari ${'meta' in data && data?.meta?.total}`}</div>
                    </div>
                }
            </>
        )
}