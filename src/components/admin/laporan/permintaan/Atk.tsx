"use client"

import TableLaporanPermintaanAtk from "./TableLaporanPermintaanAtk"

export default function Atk() {
    return (
        <section className="p-4">
            {/* <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Laporan Permintaan ATK
            </h1> */}

            <TableLaporanPermintaanAtk
                url='api/permintaan-atk'
                limit={0}
                isSearchableName={false}
            />

        </section>
    )
}