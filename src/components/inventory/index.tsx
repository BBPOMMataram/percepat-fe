import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cs from "classnames";
import { useState } from "react";
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
                    <button onClick={() => setIsReagen(!isReagen)} className="text-5xl">
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