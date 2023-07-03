export default function TableAtk() {
    return (
        <>
            <table className="w-full border-collapse">
                <caption className="text-2xl my-2">Data ATK</caption>
                <thead className="[&_th]:border [&_th]:border-quaternary text-left">
                    <tr className="bg-secondary [&>th]:p-2">
                        <th>No</th>
                        <th>Nama</th>
                        <th>Satuan</th>
                        <th>Stok</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody className="[&_td]:border [&_td]:border-quaternary">
                    <tr className="[&>td]:px-2 [&>td]:py-1">
                        <td>BELUM JADI</td>
                        <td>BELUM JADI</td>
                        <td>BELUM JADI</td>
                        <td>BELUM JADI</td>
                        <td>BELUM JADI</td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}