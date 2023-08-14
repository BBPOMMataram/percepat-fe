"use client"

import axios from "@/config/axios";
import { fetchUser, fetchUsers, userActions } from "@/features/userSlice";
import { RootState } from "@/redux/store";
import { faCartFlatbedSuitcase, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import LoadingWithoutText from "../layouts/LoadingWithoutText";

interface ITableProps {
    url: string,
    limit: number,
    title?: string,
}

export default function TablePermintaanAtk({ url, limit, title }: ITableProps) {
    const data = useSelector((state: RootState) => state.userReducer.dataUser)

    const [valuePerPage, setValuePerPage] = useState('5')
    const [nameToSearch, setNameToSearch] = useState('')
    const [delaySearch, setDelaySearch] = useState('') //AGAR BISA DIGUNAKAN DI USEEFFECT UNTUK TIMEOUT (DELAY)

    const dispatch = useDispatch<any>()

    // PASTIKAN META ADA PADA DATA ATAU SET KOSONG (TYPESCRIPT)
    const currentPage = data && 'meta' in data ? data?.meta?.current_page : ''
    const urlToFetch = `${url}?value_per_page=${valuePerPage}&name=${nameToSearch}&page=${currentPage}&limit=${limit}`

    useEffect(() => {
        dispatch(fetchUsers(urlToFetch))
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
            axios.delete(`/api/users/${id}`)
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
                })
                .catch(err => console.log(err))
        }
    }

    // MENGISI FORM UNTUK DIEDIT
    const editHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        if (id) {
            dispatch(fetchUser(id))
            dispatch(userActions.toggleForm())
        }
    }

    const tableHeaderFields =
        <tr className="bg-secondary [&>th]:p-2">
            <th>No</th>
            <th>Nama</th>
            <th>Email</th>
            <th>Posisi</th>
            <th>Foto</th>
            <th>TTD</th>
            <th>Bidang</th>
            <th className="bg-black"></th>
        </tr>

    const items = () => {
        let number = 1

        // HANDLE JIKA REAGEN TANPA LIMIT YAITU DATA SELURUHNYA MAKA ATUR NOMOR INDEX NYA PER HALAMAN, JIKA LIMIT ADA ABAIKAN INI
        if (data && 'meta' in data && data?.meta?.current_page !== 1) {
            number = (data?.meta?.current_page - 1) * parseInt(valuePerPage) + 1
        }

        return data?.data?.map((item: any, index: number) => {
            const photo =
                <Image
                    src={item.photo || '/assets/images/noimage.webp'}
                    width={100}
                    height={100}
                    alt={`Foto Profil ${item.name}`}
                />

            const signature =
                <Image
                    src={item.signature || '/assets/images/noimage.webp'}
                    width={100}
                    height={100}
                    alt={`TTD ${item.name}`}
                />

            return (
                <tr key={index}>
                    <td>{number++}</td>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.position}</td>
                    <td>{photo}</td>
                    <td>{signature}</td>
                    <td>{item.bidang?.name}</td>
                    <td className="whitespace-nowrap [&>a]:mx-1">
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
                        {items()}
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
                                            onClick={() => dispatch(fetchUsers(url))}
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