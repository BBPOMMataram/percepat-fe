import Image from "next/image";
import Link from "next/link";

export default function HeroSiapMelayani() {
    return (
        <section className="relative w-full max-w-5xl mx-auto pt-4 pb-8 flex flex-col items-center justify-center text-center" id="hero-siap-melayani">
           
            {/* Title & Subtitle */}
            <div className="title flex flex-col items-center justify-center max-w-3xl">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-serif">
                    SIAP MELAYANI
                </h1>
                <p className="mt-3 text-sm md:text-base lg:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
                    Sistem Aplikasi Manajemen Layanan Publik Informasi
                </p>
            </div>

            {/* Mascots */}
            <div className="mt-8 flex justify-center items-center gap-4 md:gap-8 mb-8">
                <div className="group relative flex flex-col items-center transition-all duration-300 hover:-translate-y-1">
                    <div className="w-28 h-28 md:w-44 md:h-44 relative drop-shadow-md">
                        <Image src="/assets/images/siinges.png" alt="Si Inges" className="object-contain" fill priority />
                    </div>
                </div>
                <div className="group relative flex flex-col items-center transition-all duration-300 hover:-translate-y-1">
                    <div className="w-28 h-28 md:w-44 md:h-44 relative drop-shadow-md">
                        <Image src="/assets/images/sisolah.png" alt="Si Solah" className="object-contain" fill priority />
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 mb-5">
                <Link
                    href="/siap-melayani/pengajuan-pkl"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bpom-blue text-white font-medium text-sm shadow-sm hover:bg-bpom-blue/90 hover:shadow transition-all"
                >
                    <span className="material-symbols-outlined !text-[18px]">school</span>
                    <span>Pengajuan PKL</span>
                </Link>
                <a
                    href="#statistik"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
                >
                    <span className="material-symbols-outlined !text-[18px]">bar_chart</span>
                    <span>Statistik & Kuota</span>
                </a>
            </div>
        </section>
    );
}
