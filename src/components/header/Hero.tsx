import Image from "next/image"

const Hero = () => {
    return (
        <>
            <div className="hero relative h-screen"> {/* relative here to avoid warning Image has "fill" adn parent elwith invalid "position" */}
                <Image src={"/assets/images/hero.webp"} alt="Hero Image of Percepat" fill priority />
                <div className="backdrop flex h-full w-full absolute bg-gray-800 bg-opacity-60">
                    <div className="welcome flex-1 flex flex-col justify-center p-8">
                        <h1 className="text-primary text-xl sm:text-2xl md:text-3xl lg:text-5xl mb-4">
                            Selamat datang di <strong className="block text-secondary">APLIKASI PERCEPAT</strong>
                        </h1>
                        <div className="button">
                            <button className="bg-secondary rounded px-6 py-2 mr-2 mb-2">Masuk</button>
                            <a href="#inventory" className="bg-quaternary rounded px-6 py-3 text-primary">Lihat Inventory</a>
                        </div>
                    </div>
                    <div className="img-header hidden md:flex flex-1 bg-gradient-to-l from-teriary justify-center items-center">
                        <Image src={"/assets/images/header-img.png"} alt="Hero Image of Percepat" width={500} height={500} />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Hero