"use client"

import axios from "@/config/axios";
import { fetchDataAtk, fetchListInventory, permintaanActions, removeData } from "@/features/permintaanSlice";
import { useAuth } from "@/hooks/useAuth";
import { RootState } from "@/redux/store";
import { faCartFlatbedSuitcase, faClipboardList, faDownload, faPen, faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import LoadingWithoutText from "../layouts/LoadingWithoutText";

interface IPermintaan {
    url: string,
    limit: number,
    title?: string,
    isWithAction?: boolean,
    isSearchableName?: boolean
}

export default function TablePermintaanAtk({ url, limit, title, isWithAction = true, isSearchableName = true }: IPermintaan) {
    const atk = useSelector((state: RootState) => state.permintaanReducer.dataAtk)
    const currentDataId = useSelector((state: RootState) => state.permintaanReducer.currentDataId)

    const [valuePerPage, setValuePerPage] = useState('5')
    const [nameToSearch, setNameToSearch] = useState('')
    const [delaySearch, setDelaySearch] = useState('') //AGAR BISA DIGUNAKAN DI USEEFFECT UNTUK TIMEOUT (DELAY)
    const [isDownloadLoading, setIsDownloadLoading] = useState(false)

    const { user } = useAuth({ middleware: 'auth' })

    const dispatch = useDispatch<any>()

    useEffect(() => {
        const link = `${url}?value_per_page=${valuePerPage}&name=${nameToSearch}&page=${atk?.current_page}&limit=${limit}`
        dispatch(fetchDataAtk(link))

        /// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valuePerPage, nameToSearch, atk?.current_page, limit, dispatch, atk.current_page])

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

        id && dispatch(removeData(id))
        const link = `${url}?value_per_page=${valuePerPage}&name=${nameToSearch}&page=${atk?.current_page}&limit=${limit}`
        dispatch(fetchDataAtk(link))
    }

    // MENGISI FORM UNTUK DIEDIT
    const editHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        dispatch(fetchListInventory(id))
        dispatch(permintaanActions.toggleForm())
        dispatch(permintaanActions.setIsEditMode(true))
        dispatch(permintaanActions.setCurrentDataId(id)) // untuk ambil data tgl permintaan
    }

    const showListHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        dispatch(fetchListInventory(id))
        dispatch(permintaanActions.toggleForm())
        dispatch(permintaanActions.setIsViewMode(true))
        dispatch(permintaanActions.setCurrentDataId(id)) // untuk ambil data tgl permintaan
    }

    const downloadHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        dispatch(permintaanActions.setCurrentDataId(id)) // untuk ambil data tgl permintaan
        setIsDownloadLoading(true)

        axios({
            url: `/api/download-permintaan-atk/${id}`,
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `SPB-ATK-${id}.pdf`); //or any other extension
                document.body.appendChild(link);
                link.click();

                toast.success('Download berhasil !', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });
                setIsDownloadLoading(false)
            })
            .catch(err => console.log(err))
    }

    const items = () => {
        let number = 1

        // HANDLE JIKA atk TANPA LIMIT YAITU DATA SELURUHNYA MAKA ATUR NOMOR INDEX NYA PER HALAMAN, JIKA LIMIT ADA ABAIKAN INI
        // if (atk.data && atk?.current_page !== 1) {
        //     number = (atk?.current_page - 1) * parseInt(valuePerPage) + 1
        // }
        if (!!atk.current_page && atk?.current_page !== 1) {
            number = (atk?.current_page - 1) * parseInt(valuePerPage) + 1
        }

        const data = atk?.data || atk // DATA DENGAN ATAU TANPA LIMIT
        return data.length <= 0 ? <tr><td colSpan={8} className="text-center text-teriary">Tidak ada data</td></tr>
            :
            data.map((item: any, index: number) => {

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
                                {isDownloadLoading && item.id == currentDataId ?
                                    <a href="#" title="Downloading SPB" className="text-green-600"><FontAwesomeIcon icon={faSpinner} className="animate-spin" /></a>
                                    :
                                    <a href="#" data-id={item.id} onClick={downloadHandler} title="Download SPB" className="text-green-600"><FontAwesomeIcon icon={faDownload} /></a>
                                }
                                <a href="#" data-id={item.id} onClick={showListHandler} title="List" className="text-blue-800"><FontAwesomeIcon icon={faClipboardList} /></a>
                                {(user.data.position === 'pemohon' || user.data.position === 'penyerah' || user.data.position === null) &&
                                    <>
                                        <a href="#" data-id={item.id} onClick={editHandler} className="text-quaternary"><FontAwesomeIcon icon={faPen} /></a>
                                        <a href="#" data-id={item.id} onClick={removeHandler} className="text-red-600"><FontAwesomeIcon icon={faTrash} /></a>
                                    </>
                                }
                            </td>
                        }
                    </tr>
                )
            })
    }

    return !atk ? <LoadingWithoutText />
        : (
            <>
                <div className="table-header flex items-end mt-3">
                    <h2 className="text-xl sm:text-2xl">
                        {title && <FontAwesomeIcon icon={faCartFlatbedSuitcase} flip="horizontal" />} <span>{title}</span>
                    </h2>
                    {
                        !limit &&
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
                    {
                        isSearchableName &&
                        <div className="search ml-auto">
                            <input type="text" className="p-2 border border-quaternary focus:outline-none rounded"
                                placeholder="Cari berdasarkan nama"
                                value={delaySearch}
                                onChange={handleSearch}
                                onClick={(e: any) => e.target.select()}
                            />
                        </div>
                    }
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
                    !limit &&
                    <div className="table-footer flex items-center">
                        <div className="grow">
                            {atk?.links?.map((item: any, i: number) => {
                                let { url, label, active } = item

                                // remove words 'Previous' and 'Next'
                                label = label === '&laquo; Previous' ? "<"
                                    : label === 'Next &raquo;' ? '>' : label

                                let disabled = atk.current_page === atk.last_page && label === '>'
                                    || atk.current_page === 1 && label === '<'


                                const isShowLink =
                                    label == '<' ||
                                    label == '>' ||
                                    label == '1' || //first page
                                    label == atk.current_page ||
                                    // label == atk.current_page + 1 ||
                                    // label == atk.last_page - 1 ||
                                    label == atk.last_page

                                return isShowLink ? (
                                    <Fragment key={i}>
                                        <button className={`p-2 rounded py-1 mx-[.1rem] my-2 ${active ? 'bg-teriary' : disabled ? 'bg-gray-200 text-gray-400' : 'bg-secondary '}`}
                                            dangerouslySetInnerHTML={{ __html: label }
                                            }
                                            onClick={() => dispatch(fetchDataAtk(url))}
                                            disabled={disabled}
                                        />
                                    </Fragment >
                                ) : (label >= atk.current_page && label <= atk.last_page) ? <span key={i} className="align-bottom">.</span>
                                    : null
                            })}
                        </div>
                        <div className="py-2 px-4 rounded bg-secondary">{`${atk?.data?.length} dari ${atk?.total} `}</div>
                    </div>
                }
            </>
        )
}