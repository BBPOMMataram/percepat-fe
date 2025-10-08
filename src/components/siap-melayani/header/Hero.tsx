import Image from "next/image";

export default function HeroSiapMelayani() {
    return (
        <div className="lg:px-14 md:py-10 p-4 flex flex-col gap-10 md:gap-16" id="hero-siap-melayani">
            <div className="title flex-1 flex flex-col items-center justify-center">
                <h1 className="font-serif text-xl font-bold md:text-5xl">SIAP MELAYANI</h1>
                <p className="text-sm md:text-base text-gray-700">Sistem Aplikasi Manajemen Layanan Publik Informasi</p>
            </div>
            <div className="bottom flex justify-center">
                {/* <div className="wa md:flex-1">
                    <div className="wa rounded">
                        wa
                    </div>
                </div> */}
                <div className="images flex">
                    <span className="w-20 h-20 md:w-40 md:h-40 relative">
                        <Image src="/assets/images/siinges.png" alt="Si Solah image" className="object-contain" fill priority />
                    </span>
                    <span className="w-20 h-20 md:w-40 md:h-40 relative">
                        <Image src="/assets/images/sisolah.png" alt="Si Solah image" className="object-contain" fill priority />
                    </span>
                </div>
            </div>
        </div>
    )
}