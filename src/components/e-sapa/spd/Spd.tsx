import Link from "next/link";

export default function Spd() {
    return (
        <div className="py-16 px-4 sm:px-8 w-full flex flex-col items-center justify-center min-h-[70vh]">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 text-center">Fitur Dalam Pengembangan</h1>
            <p className="text-slate-500 text-center max-w-md mb-8">
                Halaman <span className="font-semibold text-slate-700">Surat Perjalanan Dinas (SPD)</span> saat ini sedang dalam tahap perancangan dan pengembangan. Fitur ini akan segera tersedia pada pembaruan sistem mendatang.
            </p>
            <Link href="/e-sapa/dashboard" className="px-6 py-3 bg-[#0f172a] hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali ke Dashboard
            </Link>
        </div>
    );
}
