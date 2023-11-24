"use client"

import TablePermintaanReagen from "./TableLaporanPermintaanReagen"

export default function Reagen() {
    return (
        <section className="p-4">
            {/* <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">
                Laporan Permintaan Reagen
            </h1> */}

            <TablePermintaanReagen
                url='api/laporan-permintaan'
                limit={0}
                isSearchableName={true} // karena tidak ada nama yang jadi patokan
            />

        </section>
    )
}