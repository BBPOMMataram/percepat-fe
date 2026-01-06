
export const metadata = {
    title: 'Dashboard'
}

const Dashboard = async () => {
    // const totalBarang = await axios('/api/barang').then(r => r.data.data.total)
    // const totalBidang = await axios('/api/bidang-count').then(r => r.data)
    // const totalUser = await axios('/api/users-count').then(r => r.data)
    return (
        <>
            {/* CARDS CONTAINER */}
            {/* <section className="flex flex-col sm:flex-row flex-wrap">
                <Card link="/percepat/barang/reagen" title="Reagen" total={totalBarang?.reagen} desc="Jumlah Reagen tersedia" />
                <Card link="/percepat/barang/atk" title="ATK" total={totalBarang?.atk} desc="Jumlah ATK tersedia" />
                <Card link="/percepat/bidang" title="Fungsi" total={totalBidang} desc="Jumlah fungsi yang terdaftar" />
                <Card link="/percepat/users" title="Pengguna" total={totalUser} desc="Jumlah pengguna aplikasi Percepat" />
            </section> */}
            {/* PENERIMAAN CONTAINER */}
            <section className="mt-20">
                <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">Penerimaan Terbaru</h1>

                {/* <TablePenerimaanReagen
                    title="Reagen"
                    url='api/penerimaan-reagen'
                    limit={5}
                    isWithAction={false}
                    isSearchableName={false}
                />
                <br />
                <TablePenerimaanAtk
                    title='ATK'
                    url='api/penerimaan-atk'
                    limit={5}
                    isWithAction={false}
                    isSearchableName={false}
                /> */}
            </section>

            {/* PERMINTAAN CONTAINER */}
            <section className="mt-20">
                <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">Permintaan Terbaru</h1>

                {/* <TablePermintaanReagen
                    title='Reagen'
                    url='api/permintaan-reagen'
                    limit={5}
                    isWithAction={false}
                    isSearchableName={false}
                /> */}
                {/* <TablePermintaanAtk
                    title='ATK'
                    url='api/permintaan-atk'
                    limit={5}
                    isWithAction={false}
                    isSearchableName={false}
                /> */}
            </section>
        </>
    )
}

export default Dashboard