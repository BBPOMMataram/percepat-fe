"use client"

import axios from "@/config/axios";
import { fetchDataReagen, laporanPermintaanActions } from "@/features/laporanPermintaanSlice";
import { RootState } from "@/redux/store";
import { faCartFlatbedSuitcase, faDownload, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChangeEvent, Fragment, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { toast } from "react-toastify";
import LoadingWithoutText from "../../layouts/LoadingWithoutText";

interface IPermintaan {
    url: string,
    limit: number,
    title?: string,
    isWithAction?: boolean,
    isSearchableName?: boolean,
}

interface ISelectBox {
    value: string,
    label: string,
}

export default function TableLaporanPermintaanReagen({ url, limit, title, isWithAction = true, isSearchableName = true }: IPermintaan) {
    const reagen = useSelector((state: RootState) => state.laporanPermintaanReducer.dataReagen)
    const currentDataId = useSelector((state: RootState) => state.laporanPermintaanReducer.currentDataId)
    const isSideBarOpen = useSelector((state: RootState) => state.sideBar.isSideBarOpen)

    const [valuePerPage, setValuePerPage] = useState({ value: '5', label: '5' })
    const [nameToSearch, setNameToSearch] = useState('')
    const [delaySearch, setDelaySearch] = useState('') //AGAR BISA DIGUNAKAN DI USEEFFECT UNTUK TIMEOUT (DELAY)
    const [isDownloadLoading, setIsDownloadLoading] = useState(false)
    const [year, setYear] = useState<ISelectBox>()
    const [month, setMonth] = useState<ISelectBox>()
    const [bidang, setBidang] = useState<ISelectBox>()

    const dispatch = useDispatch<any>()

    const bidangSelectRef = useRef(null)

    const loadBidangOptions = async (
        inputValue: string
    ): Promise<ISelectBox[]> => {
        const urlData = `api/bidang/getAll`
        const { data } = await axios(urlData)

        const bidangOptions = data.data.map((item: any) => {
            return {
                value: item.id,
                label: `${item.name}`,
            }
        })

        return bidangOptions
    };

    const valuePerPageOptions = [
        { value: '5', label: '5' },
        { value: '10', label: '10' },
        { value: '25', label: '25' },
        { value: '50', label: '50' },
        { value: '100', label: '100' },
    ]

    const yearOptions = [
        { value: '2023', label: '2023' },
        { value: '2022', label: '2022' },
    ]

    const monthOptions = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ]

    useEffect(() => {
        if (month && !year) {
            toast.warning('Tentukan Tahun untuk filter Bulan')
        }

        const link = `${url}?value_per_page=${valuePerPage.value}` +
            `&name=${nameToSearch}` +
            `&page=${reagen?.current_page}` +
            `&limit=${limit}` +
            `&year=${year?.value}` +
            `&month=${month?.value}` +
            `&bidang=${bidang?.value}`

        dispatch(fetchDataReagen(link))

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valuePerPage, nameToSearch, reagen?.current_page, year, month, bidang])

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setDelaySearch(e.target.value)
    }

    // UNTUK DELAY SETNAMETOSEARCH 
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setNameToSearch(delaySearch)
        }, 500)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [delaySearch])

    const downloadHandler = (e: any) => {
        e.preventDefault()
        const id = e.currentTarget.getAttribute('data-id');

        dispatch(laporanPermintaanActions.setCurrentDataId(id)) // untuk buat kondisi loading icon
        setIsDownloadLoading(true)

        axios({
            url: `/api/download-permintaan-reagen/${id}`,
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                const url = window.URL.createObjectURL(new Blob([data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `SPB-Reagen-${id}.pdf`); //or any other extension
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

        // HANDLE JIKA REAGEN TANPA LIMIT YAITU DATA SELURUHNYA MAKA ATUR NOMOR INDEX NYA PER HALAMAN, JIKA LIMIT ADA ABAIKAN INI
        if (!!reagen.current_page && reagen?.current_page !== 1) {
            number = (reagen?.current_page - 1) * parseInt(valuePerPage.value) + 1
        }

        const data = reagen?.data || reagen // DATA DENGAN ATAU TANPA LIMIT

        return data.length <= 0 ? <tr><td colSpan={13} className="text-center text-teriary">Tidak ada data</td></tr>
            : data.map((item: any, index: number) => {

                const tanggalPermintaan = item.permintaan?.tgl_permintaan ?
                    new Date(item.permintaan.tgl_permintaan).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                    : '-'

                const tanggalPenyerahan = item.permintaan?.tgl_penyerahan ?
                    new Date(item.permintaan.tgl_penyerahan).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                    : '-'

                const expired = item.barang.expired ?
                    new Date(item.barang.expired).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                    : '-'

                return (
                    <tr key={index} className="[&>td]:text-center">
                        <td>{number++}</td>
                        <td>{item.barang.name}</td>
                        <td>{item.barang.satuan}</td>
                        <td>{expired}</td>
                        <td>{item.jumlahpermintaan}</td>
                        <td>{item.jumlahrealisasi || '-'}</td>
                        <td>{item.permintaan?.bidang?.name}</td>
                        <td>{item.permintaan?.bidang?.user.name}</td>{/* user disini kabid */}
                        <td>{item.permintaan?.status.name}</td>
                        <td>{tanggalPermintaan}</td>
                        <td>{tanggalPenyerahan}</td>
                        <td>{item.keterangan || '-'}</td>
                        {isWithAction &&
                            <td className="whitespace-nowrap [&>a]:mx-1 text-center">
                                {isDownloadLoading && item.id == currentDataId ?
                                    <a href="#" title="Downloading SPB" className="text-green-600"><FontAwesomeIcon icon={faSpinner} className="animate-spin" /></a>
                                    :
                                    <a href="#" data-id={item.permintaan?.id} onClick={downloadHandler} title="Download SPB" className="text-green-600"><FontAwesomeIcon icon={faDownload} /></a>
                                }
                            </td>
                        }
                    </tr>
                )
            })
    }

    return !reagen ? <LoadingWithoutText />
        : (
            <>
                <div className="table-header flex items-end mt-3">
                    <h2 className="text-xl sm:text-2xl">
                        {title && <FontAwesomeIcon icon={faCartFlatbedSuitcase} flip="horizontal" />} <span>{title}</span>
                    </h2>
                    <div className="flex">
                        <Select
                            options={valuePerPageOptions}
                            isClearable
                            className="w-fit"
                            value={valuePerPage}
                            onChange={(option: any) => setValuePerPage(option)}
                        />

                        <Select
                            options={yearOptions}
                            isClearable
                            placeholder="Tahun"
                            className="ml-1 w-fit"
                            value={year}
                            onChange={(option: any) => setYear(option)}
                        />

                        <Select
                            options={monthOptions}
                            isClearable
                            placeholder="Bulan"
                            className="ml-1 w-fit"
                            value={month}
                            onChange={(option: any) => setMonth(option)}
                        />

                        <AsyncSelect
                            ref={bidangSelectRef}
                            name={'bidang_id'}
                            className="ml-1 w-fit"
                            cacheOptions
                            loadOptions={loadBidangOptions}
                            defaultOptions
                            isClearable
                            placeholder="Bidang"
                            value={bidang}
                            onChange={(option: any) => setBidang(option)}
                        />
                        {
                            isSearchableName &&
                            <div className="search">
                                <input type="text" className="p-[6px] ml-1 border border-quaternary focus:outline-none rounded"
                                    placeholder="Cari berdasarkan nama"
                                    value={delaySearch}
                                    onChange={handleSearch}
                                    onClick={(e: any) => e.target.select()}
                                />
                            </div>
                        }
                    </div>
                </div>
                <div className={`overflow-auto max-w-[${isSideBarOpen ? '1065px' : '1201px'}]`}>
                    <table className="w-full border-collapse mt-2 table-auto">
                        <thead className="[&_th]:border [&_th]:border-quaternary text-left">
                            <tr className="bg-secondary [&>th]:p-2 [&>th]:text-center">
                                <th>No</th>
                                <th>Nama Barang</th>
                                <th>Satuan</th>
                                <th>Expired</th>
                                <th>Jumlah Permintaan</th>
                                <th>Jumlah Realisasi</th>
                                <th>Bidang</th>
                                <th>KaTim / Penyelia</th>
                                <th>Status</th>
                                <th>Tanggal Permintaan</th>
                                <th>Tanggal Penyerahan</th>
                                <th>Keterangan</th>
                                {isWithAction &&
                                    <th className="bg-black"></th>
                                }
                            </tr>
                        </thead>
                        <tbody className="[&_td]:border [&_td]:border-quaternary [&_td]:px-2 [&_td]:py-1">
                            {items()}
                        </tbody>
                    </table>
                </div>
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