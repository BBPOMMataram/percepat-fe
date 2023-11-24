"use client"

import TableLaporanPermintaanAtk from "./TableLaporanPermintaanAtk"

export default function Atk() {
    return (
        <section className="p-4">
            <TableLaporanPermintaanAtk
                url='api/laporan-permintaan-atk'
                limit={0}
                isSearchableName={false}
            />

        </section>
    )
}