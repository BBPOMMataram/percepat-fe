import Reagen from "@/components/admin/penerimaan/Reagen"

export const metadata = {
    title: 'Penerimaan Reagen'
}

// COMPONENT INI DIPISAH AGAR DIBUAT MENJADI SERVER SIDE COMPONENT AGAR BISA MEMBUAT TITLE DI METADATA
const PenerimaanReagen = () => {
    return  <Reagen />
}

export default PenerimaanReagen