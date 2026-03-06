import cs from "classnames";
import { useState } from "react";
import TableAtk from "./TableAtk";
import TablePerlengkapan from "./TablePerlengkapan";
import TableReagen from "./TableReagen";

type TypeBarang = 'reagen' | 'atk' | 'perlengkapan'

const Inventory = () => {
    const [typeBarang, setTypeBarang] = useState<TypeBarang>('reagen')

    return (
        <>
            <section className="header text-center mt-2">
                <h2 className="text-2xl">Daftar Inventaris<span className="block sm:inline"> BBPOM di Mataram</span></h2>
                <nav className="my-4">
                    <ul className="[&>li]:inline">
                        <li onClick={() => setTypeBarang('reagen')}>
                            <a className={cs("rounded py-1 inline-block w-20 mr-2", {
                                "bg-quaternary": typeBarang === 'reagen',
                                "bg-gray-100 text-gray-300": typeBarang !== 'reagen'
                            })}
                            >Reagen</a>
                        </li>
                        <li onClick={() => setTypeBarang('atk')}>
                            <a className={cs("rounded py-1 inline-block w-20 mr-2", {
                                "bg-quaternary": typeBarang === 'atk',
                                "bg-gray-100 text-gray-300": typeBarang !== 'atk'
                            })}>ATK</a>
                        </li>
                        <li onClick={() => setTypeBarang('perlengkapan')}>
                            <a className={cs("rounded py-1 inline-block px-2", {
                                "bg-quaternary": typeBarang === 'perlengkapan',
                                "bg-gray-100 text-gray-300": typeBarang !== 'perlengkapan'
                            })}>Perlengkapan</a>
                        </li>
                    </ul>
                </nav>
            </section>
            <section className="content">
                <div className="w-full">
                    {typeBarang === 'reagen' ?
                        <TableReagen
                            url='api/v1/barang/reagen'
                            title='Data Reagen'
                        />
                        : typeBarang === 'atk' ?
                            <TableAtk
                                url='api/v1/barang/atk'
                                title='Data ATK'
                            />
                            :
                            <TablePerlengkapan
                                url='api/v1/barang/perlengkapan'
                                title='Data Perlengkapan'
                            />
                    }
                </div>
            </section>
        </>
    )
}

export default Inventory
