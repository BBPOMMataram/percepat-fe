"use client"
import { getUser } from "@/features/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TimelineFlowSimpelBmn from "./TimelineFlow";
import ModalDetailPemeliharaan from "./pemeliharaan/detail/ModalDetailPemeliharaan";

export default function MainSimpelBmn() {
    const dispatch = useDispatch<AppDispatch>()
    const { user } = useSelector((state: RootState) => state.auth)
    const pathname = usePathname()
    const modalTrackingRef = useRef<HTMLDialogElement>(null)
    const inputCodeRef = useRef<HTMLInputElement>(null)
    const [code, setCode] = useState<string>("")
    const [showModalDetailPemeliharaan, setShowModalDetailPemeliharaan] = useState<boolean>(false)

    const tracking = () => {
        setShowModalDetailPemeliharaan(true)
        modalTrackingRef.current?.close()
        setTimeout(() => {
            setCode("")
        }, 100);
    }

    const openModalTracking = () => {
        modalTrackingRef.current?.showModal()
        setTimeout(() => {
            inputCodeRef.current?.focus()
        }, 100);
    }

    useEffect(() => {
        dispatch(getUser());
    }, [dispatch]);

    return (
        <>
            <div className="relative h-screen">
                <Image src={"/assets/images/simpel-bmn/bg-simpel-bmn.webp"} alt="Background simpel bmn" fill priority className="object-cover" />
                <div className="backdrop flex h-full w-full absolute bg-bpom-blue/10">
                    <div className="welcome flex-1 flex flex-col justify-center p-8 md:pl-12">
                        <motion.div
                            initial={{ x: "-50%" }}
                            animate={{ x: 0 }}
                            transition={{ delay: .5 }}
                        >
                            <Image src={"/assets/images/bpom.webp"} alt="Background simpel bmn" priority width={150} height={150} className="w-28 md:w-40 p-2" />
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-primary mb-8">
                            <motion.strong
                                initial={{ filter: "blur(10px)" }}
                                animate={{ filter: "none" }}
                                transition={{ delay: 0.5 }}
                                className="block text-xl sm:text-2xl md:text-3xl lg:text-5xl">
                                SIMPEL BMN
                            </motion.strong>
                            <motion.strong
                                initial={{ filter: "blur(10px)" }}
                                animate={{ filter: "none" }}
                                transition={{ delay: 1 }}
                                className="block text-sm sm:text-lg">
                                SISTEM MANAJEMEN PEMELIHARAAN
                            </motion.strong>
                            <motion.p
                                initial={{ filter: "blur(10px)" }}
                                animate={{ filter: "none" }}
                                transition={{ delay: 1.5 }}
                                className="text-black text-xs sm:text-sm mt-1 mb-1">
                                Inovasi Digitalisasi Permintaan Perawatan dan Pemeliharaan Sarana dan Prasarana<br /><span className="text-bpom-blue font-semibold">Balai Besar</span> <span className="text-bpom-green font-semibold">Pengawas Obat dan Makanan di Mataram</span>
                            </motion.p>
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, staggerChildren: 1, }}
                            className="button"
                        >
                            {user ?
                                <div className="flex gap-2 flex-wrap">
                                    <Link
                                        href="/simpel-bmn/pemeliharaan"
                                        className="btn btn-primary">
                                        DATA PEMELIHARAAN
                                    </Link>

                                    <motion.a
                                        href="/simpel-bmn/pemeliharaan/form"
                                        className="btn btn-error">
                                        AJUKAN PEMELIHARAAN
                                    </motion.a>

                                    {/* MODAL TRACKING PEMELIHARAAN  */}
                                    <motion.button className="btn btn-accent" onClick={openModalTracking}>
                                        TRACKING PEMELIHARAAN
                                    </motion.button>
                                    <dialog id="my_modal_2" className="modal" ref={modalTrackingRef}>
                                        <div className="modal-box">
                                            <h3 className="font-bold text-lg mb-4">Masukkan kode pemeliharaan!</h3>
                                            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="ar-input-text-purple w-full" ref={inputCodeRef} />
                                            <div className="modal-action">
                                                <button className="btn btn-accent" onClick={tracking}>Cari</button>
                                            </div>
                                        </div>
                                        <form method="dialog" className="modal-backdrop">
                                            <button>Tutup</button>
                                        </form>
                                    </dialog>

                                    <ModalDetailPemeliharaan
                                        show={showModalDetailPemeliharaan}
                                        onClose={() => setShowModalDetailPemeliharaan(false)}
                                        code={code}
                                    />
                                </div>
                                :
                                <Link href={`/login?redirectUrl=${pathname}`}>
                                    <motion.button
                                        className="btn btn-primary rounded px-6 py-2 mr-2 mb-2">
                                        Masuk
                                    </motion.button>
                                </Link>
                            }
                        </motion.div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: .5, duration: 2 }}
                        className="hero-illustration hidden lg:flex flex-1 bg-gradient-to-l from-primary/80 justify-center items-center"
                    >
                        <TimelineFlowSimpelBmn />
                    </motion.div>
                </div>
            </div >
        </>
    )
}