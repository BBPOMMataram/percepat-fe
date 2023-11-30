"use client"

import Atk from "@/components/admin/laporan/permintaan/Atk"
import Reagen from "@/components/admin/laporan/permintaan/Reagen"
import axios from "@/config/axios"
import { faDownload, faSun, faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import classNames from "classnames"
import { useState } from "react"
import { toast } from "react-toastify"

const LaporanPermintaan = () => {
    const [isReagen, setIsReagen] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    const downloadHandler = () => {
        setIsLoading(true)

        axios({
            url: `/api/download-laporan-permintaan`,
            method: 'GET',
            responseType: 'blob'
        })
            .then(({ data }) => {
                const url = window.open(URL.createObjectURL(data));
                // const link = document.createElement('a');
                // link.href = url;
                // link.setAttribute('download', `SPB-ATK.pdf`); //or any other extension
                // document.body.appendChild(link);
                // link.click();

                // toast.success('Download berhasil !', {
                //     position: "top-right",
                //     autoClose: 5000,
                //     hideProgressBar: false,
                //     closeOnClick: true,
                //     pauseOnHover: true,
                //     draggable: true,
                //     progress: undefined,
                //     theme: "light",
                // });
                setIsLoading(false)
            })
            .catch(err => {
                console.log(err)
                setIsLoading(true)
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