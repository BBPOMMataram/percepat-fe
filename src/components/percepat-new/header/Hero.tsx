import { showAlert } from "@/features/alertSlice";
import { getUser, logout } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const Hero = () => {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();

    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    const handleClick = () => {
        dispatch(logout())
        dispatch(showAlert({ type: 'success', message: 'You have been logged out', description: 'logout success' }))
        router.push('/login')
    }

    return (
        <>
            {/* button logout */}
            {
                user &&
                <button
                    onClick={handleClick}
                    className="fixed top-6 right-6 z-50 btn btn-error btn-circle p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center tooltip tooltip-left"
                    data-tip="Logout"
                >
                    <span className="material-symbols-outlined text-xl">
                        logout
                    </span>
                </button>
            }
            <div className="hero relative h-screen"> {/* relative here to avoid warning Image has "fill" adn parent elwith invalid "position" */}
                <Image src={"/assets/images/percepat/hero.webp"} alt="Hero Image of Percepat" fill priority />
                <div className="backdrop flex h-full w-full absolute bg-gray-800/60">
                    <div className="welcome flex-1 flex flex-col justify-center p-8">
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            // transition={{ duration: 1 }}
                            className="text-primary text-xl sm:text-2xl md:text-3xl lg:text-5xl mb-4">
                            Selamat datang di
                            <motion.strong
                                initial={{ x: -800 }}
                                animate={{ x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="block text-secondary">
                                APLIKASI PERCEPAT
                            </motion.strong>
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 2, staggerChildren: 1 }}
                            className="button"
                        >
                            {user ?
                                <Link href={'/percepat-new/permintaan/form'}>
                                    <motion.button
                                        whileHover={{ backgroundColor: '#C58940' }}
                                        className="bg-secondary rounded px-6 py-2 mr-2 mb-2">
                                        Buat Permintaan
                                    </motion.button>
                                </Link> :
                                <Link href={'/login?redirectUrl=/percepat-new'}>
                                    <motion.button
                                        whileHover={{ backgroundColor: '#C58940' }}
                                        className="bg-secondary rounded px-6 py-2 mr-2 mb-2">
                                        Masuk
                                    </motion.button>
                                </Link>
                            }
                            <motion.a
                                whileHover={{ backgroundColor: '#C58940' }}
                                href="#inventory"
                                className="bg-teriary rounded px-6 py-3">
                                Lihat Inventory
                            </motion.a>
                        </motion.div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 2 }}
                        className="hero-illustration hidden md:flex flex-1 bg-gradient-to-l from-teriary justify-center items-center"
                    >
                        <motion.div
                            initial={{ x: 450 }}
                            animate={{ x: 0 }}
                            transition={{ delay: 2 }}
                        >
                            <Image src={"/assets/images/percepat/hero-illustration.png"} alt="Hero Image of Percepat" width={500} height={500} />
                        </motion.div>
                    </motion.div>
                </div>
            </div >
        </>
    )
}

export default Hero