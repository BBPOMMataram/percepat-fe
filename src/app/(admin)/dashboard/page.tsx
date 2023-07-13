import TablePenerimaanAtk from "@/components/admin/dashboard/TablePenerimaanAtk"
import TablePenerimaanReagen from "@/components/admin/dashboard/TablePenerimaanReagen"

export const metadata = {
    title: 'Dashboard'
}

interface iCard {
    title: string,
    total: number,
    desc: string
}

const Card = ({ title, total, desc }: iCard) => {
    return (
        <div className="bg-secondary rounded-lg shadow-lg p-4 m-2 flex-1">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-4xl font-bold text-gray-800">{total}</p>
            <p className="text-gray-600">{desc}</p>
        </div>
    )
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
            <section className="mt-10">
                <h1 className="text-2xl my-2 bg-secondary border-l-4 border-quaternary w-fit pb-1 pt-2 px-4 sm:text-3xl xl:text-5xl">Penerimaan Terbaru</h1>

                <TablePenerimaanReagen
                    title='Reagen'
                    url='api/penerimaan-reagen'
                    limit={5}
                />
                <div className="space my-4"></div>
                <TablePenerimaanAtk
                    title='ATK'
                    url='api/penerimaan-atk'
                    limit={5}
                />
            </section>
        </>
    )
}

export default Dashboard