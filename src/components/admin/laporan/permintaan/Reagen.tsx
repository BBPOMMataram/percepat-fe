"use client"

import TablePermintaanReagen from "./TableLaporanPermintaanReagen"

export default function Reagen() {
    return (
        <section className="p-4">
            <TablePermintaanReagen
                url='api/laporan-permintaan'
                limit={0}
                isSearchableName={true} // karena tidak ada nama yang jadi patokan
            />

        </section>
    )
}