"use client"

import cs from "classnames";
import { useState } from "react";
import { CgToggleSquare, CgToggleSquareOff } from "react-icons/cg";
import TableAtk from "./TableAtk";
import TableReagen from "./TableReagen";

const Inventory = () => {
    const [isReagen, setIsReagen] = useState(true)

    return (
        <>
            <section className="header text-center mt-2">
                <h2 className="text-2xl">Daftar Inventaris<span className="block sm:inline"> BBPOM di Mataram</span></h2>
                <nav className="my-4">
                    <ul className="[&>li]:inline">
                        <li onClick={() => setIsReagen(true)}>
                            <a className={cs("rounded py-1 inline-block w-20 mr-2", {
                                "bg-quaternary text-secondary": isReagen,
                                "bg-gray-100 text-gray-300": !isReagen
                            })}
                            >Reagen</a>
                        </li>
                        <li onClick={() => setIsReagen(false)}>
                            <a className={cs("rounded py-1 inline-block w-20", {
                                "bg-quaternary text-secondary": !isReagen,
                                "bg-gray-100 text-gray-300": isReagen
                            })}>ATK</a>
                        </li>
                    </ul>
                    <button onClick={() => setIsReagen(!isReagen)}>
                        {isReagen ?
                            <CgToggleSquare className="inline-block text-6xl text-quaternary mt-0" />
                            :
                            <CgToggleSquareOff className="inline-block text-6xl text-quaternary mt-0" />
                        }
                    </button>
                </nav>
            </section>
            <section className="content">
                <div className="w-full">
                    {isReagen ?
                        <TableReagen
                            url='api/barang/reagen'
                            title='Data Reagen'
                        />
                        :
                        <TableAtk
                            url='api/barang/atk'
                            title='Data ATK'
                        />
                    }
                </div>
            </section>
        </>
    )
}

export default Inventory