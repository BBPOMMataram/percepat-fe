"use client"

import Atk from "@/components/percepat/admin/laporan/permintaan/Atk"
import Reagen from "@/components/percepat/admin/laporan/permintaan/Reagen"
import axios from "@/config/axios"
import { RootState } from "@/redux/store"
import { faDownload, faSun, faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import classNames from "classnames"
import { useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

const LaporanPermintaan = () => {
    const [isReagen, setIsReagen] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    const url = useSelector((state: RootState) => state.laporanPermintaanReducer.url)

    const downloadHandler = () => {
        setIsLoading(true)

        axios({
            url,
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                window.open(URL.createObjectURL(data));

                setIsLoading(false)
            })
            .catch(err => {
                toast.error('Terjadi kesalahan!')
                console.log(err)
                setIsLoading(false)
            })
    }

    return (
        <>
            <section className="header text-center mt-2">
                <h2 className="text-2xl uppercase font-bold">Laporan Permintaan</h2>
                <nav className="mt-4">
                    <ul className="[&>li]:inline">
                        <li onClick={() => setIsReagen(true)}>
                            <a className={classNames("rounded py-1 inline-block w-20 mr-2", {
                                "bg-quaternary text-secondary": isReagen,
                                "bg-gray-100 text-gray-300": !isReagen
                            })}
                            >Reagen</a>
                        </li>
                        <li onClick={() => setIsReagen(false)}>
                            <a className={classNames("rounded py-1 inline-block w-20", {
                                "bg-quaternary text-secondary": !isReagen,
                                "bg-gray-100 text-gray-300": isReagen
                            })}>ATK</a>
                        </li>
                    </ul>
                    <button onClick={() => setIsReagen(!isReagen)} className="text-5xl outline-none">
                        {isReagen ?
                            <FontAwesomeIcon icon={faToggleOff} className="text-quaternary" fixedWidth />
                            :
                            <FontAwesomeIcon icon={faToggleOn} className="text-quaternary" fixedWidth />
                        }
                    </button>
                    <div className="">
                        {isLoading ?
                            <FontAwesomeIcon icon={faSun}
                                className="text-quaternary animate-pulse p-2"
                                role="button"
                                size="xl"
                                spin
                            /> :
                            <FontAwesomeIcon icon={faDownload}
                                className="text-quaternary hover:animate-[bounce_1s_infinite_200ms] p-2"
                                role="button"
                                size="xl"
                                onClick={downloadHandler}
                            />
                        }
                    </div>
                </nav>
            </section>
            <section className="content">
                <div className="w-full">
                    {isReagen ?
                        <Reagen />
                        :
                        <Atk />
                    }
                </div>
            </section>
        </>

    )
}

export default LaporanPermintaan