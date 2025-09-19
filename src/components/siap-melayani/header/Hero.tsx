import Image from "next/image";

export default function HeroSiapMelayani() {
    return (
        <div className="flex-1 lg:px-14 lg:py-10 p-4 flex flex-col">
            <div className="title flex-1 flex flex-col items-center justify-center">
                <h1 className="font-serif text-xl font-bold lg:text-5xl">SIAP MELAYANI</h1>
                <p className="text-sm lg:text-base">Sistem Aplikasi Manajemen Layanan Publik Informasi</p>
            </div>
            <div className="bottom flex justify-center">
                {/* <div className="wa lg:flex-1">
                    <div className="wa rounded">
                        wa
                    </div>
                </div> */}
                <div className="images flex">
                    <span className="w-20 h-20 lg:w-40 lg:h-40 relative">
                        <Image src="/assets/images/siinges.png" alt="Si Solah image" className="object-contain" fill priority />
                    </span>
                    <span className="w-20 h-20 lg:w-40 lg:h-40 relative">
                        <Image src="/assets/images/sisolah.png" alt="Si Solah image" className="object-contain" fill priority />
                    </span>
                </div>
            </div>
        </div>
    )
}