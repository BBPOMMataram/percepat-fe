"use client"

import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import classNames from "classnames"
import { useEffect, useState } from "react"
import Reagen from "@/components/admin/laporan/permintaan/Reagen"
import Atk from "@/components/admin/laporan/permintaan/Atk"
import { useDispatch } from "react-redux"
import { toggleSideBar } from "@/features/layout/sideBarSlice"

const LaporanPermintaan = () => {
    const [isReagen, setIsReagen] = useState(true)
    
    return (
        <>
            <section className="header text-center mt-2">
                <h2 className="text-2xl uppercase font-bold">Laporan Permintaan</h2>
                <nav className="my-4">
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