import { motion } from "framer-motion";

export default function TimelineFlowSimpelBmn() {
    return (
        <div className="relative pl-6 pr-8 py-1">
            <div className="absolute top-0 right-6 h-full w-[2px] bg-gray-100"></div>

            <motion.div className="pb-2 relative bg-gradient-to-l from-gray-50/30 to-transparent pr-2 rounded-tr-sm pt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0, duration: 1 }}
            >
                <div className="absolute right-4 translate-x-1/2 top-3.5 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">
                    1
                </div>
                <div className="text-right pr-8">
                    <div className="text-lg font-bold font-mono italic text-bpom-blue">Pengisian Form Perbaikan</div>
                    <p>Pilih minimal satu barang (input kode & NUP atau scan QR Code) dan lengkapi form kemudian Submit</p>
                </div>
            </motion.div>

            <motion.div className="pb-2 relative bg-gradient-to-l from-gray-50/30 to-transparent pr-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
            >
                <div className="absolute right-4 translate-x-1/2 top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">
                    2
                </div>
                <div className="text-right pr-8">
                    <div className="text-lg font-bold font-mono italic text-bpom-blue">Approval KaTim atau KaTU</div>
                    <p>Permintaan perbaikan alat lab akan disetujui oleh KaTim, untuk barang non-lab atau non-BMN disetujui oleh KaTU</p>
                </div>
            </motion.div>

            <motion.div className="pb-2 relative bg-gradient-to-l from-gray-50/30 to-transparent pr-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
            >
                <div className="absolute right-4 translate-x-1/2 top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">
                    3
                </div>
                <div className="text-right pr-8">
                    <div className="text-lg font-bold font-mono italic text-bpom-blue">Approval KaBalai</div>
                    <p>Kemudian dilanjutkan untuk disetujui oleh KaBalai</p>
                </div>
            </motion.div>

            <motion.div className="pb-2 relative bg-gradient-to-l from-gray-50/30 to-transparent pr-2 rounded-br-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
            >
                <div className="absolute right-4 translate-x-1/2 top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-green-200 text-xs">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="text-primary h-5 w-5"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div className="text-right pr-8">
                    <div className="text-lg font-bold font-mono italic text-bpom-blue">Tindak Lanjut Petugas</div>
                    <p>Petugas akan melakukan perbaikan dan jika membutuhkan pengadaan sparepart atau harus menggunakan jasa pihak ketiga maka petugas berkoordinasi dengan PPK dan PP hingga barang berhasil diperbaiki atau ditandai Rusak Berat jika tidak dapat diperbaiki</p>
                </div>
            </motion.div>
        </div >
    )
}