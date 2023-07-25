import Card from "@/components/admin/dashboard/Card"
import TablePermintaanAtk from "@/components/admin/dashboard/TablePermintaanAtk"
import TablePermintaanReagen from "@/components/admin/dashboard/TablePermintaanReagen"
import TablePenerimaanAtk from "@/components/admin/penerimaan/TablePenerimaanAtk"
import TablePenerimaanReagen from "@/components/admin/penerimaan/TablePenerimaanReagen"

export const metadata = {
    title: 'Dashboard'
}

const Dashboard = () => {
    return (
        <>
            {/* CARDS CONTAINER */}
            <section className="flex flex-col sm:flex-row flex-wrap">
                <Card title="Reagen" total={100} desc="Jumlah Reagen tersedia" />
                <Card title="ATK" total={100} desc="Jumlah ATK tersedia" />
                <Card title="Bidang" total={6} desc="Jumlah bidang yang terdaftar" />
                <Card title="Pengguna" total={100} desc="Jumlah pengguna aplikasi Percepat" />
            </section>
            {/* PENERIMAAN CONTAINER */}
            <section className="mt-20">
                <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">Penerimaan Terbaru</h1>

                <TablePenerimaanReagen
                    title="Reagen"
                    url='api/penerimaan-reagen'
                    limit={5}
                />
                <TablePenerimaanAtk
                    title='ATK'
                    url='api/penerimaan-atk'
                    limit={5}
                />
            </section>

            {/* PERMINTAAN CONTAINER */}
            <section className="mt-20">
                <h1 className="text-2xl text-quaternary my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">Permintaan Terbaru</h1>

                <TablePermintaanReagen
                    title='Reagen'
                    url='api/permintaan-reagen'
                    limit={5}
                />
                <TablePermintaanAtk
                    title='ATK'
                    url='api/permintaan-atk'
                    limit={5}
                />
            </section>
        </>
    )
}

export default Dashboard