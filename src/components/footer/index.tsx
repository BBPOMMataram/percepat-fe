"use client"

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import { AiFillInstagram } from "@react-icons/all-files/ai/AiFillInstagram";
import { AiOutlineWhatsApp} from "@react-icons/all-files/ai/AiOutlineWhatsApp";
import { GoGlobe } from "@react-icons/all-files/go/GoGlobe";

export default function Footer() {

    useEffect(() => {


    }, [])
    return (
        <div className="flex flex-col">
            <div className="footer-content flex px-24 py-8 bg-teriary [&_li]:list-disc">
                <div className="about flex-1">
                    <nav>
                        <ul>
                            <li>Tentang Aplikasi</li>
                            <li>Kontak Kami</li>
                            <li className="!list-none [&_svg]:inline [&_svg]:mr-4">
                                <AiOutlineWhatsApp />
                                <AiFillInstagram />
                                <GoGlobe />
                            </li>
                        </ul>
                    </nav>
                </div>
                <div className="link-terkait flex-1">
                    <nav>
                        <ul>
                            <li>Subsite BBPOM di Mataram</li>
                            <li>Aplikasi SiJelapp</li>
                            <li>Pengaduan</li>
                            <li>Kritik & Saran</li>
                        </ul>
                    </nav>
                </div>
                <motion.div
                    className="logo hidden md:block flex-1"
                >
                    <Image src={"/assets/images/bpom.png"} alt="Logo BPOM RI" width={120} height={120} className="mx-auto" />
                </motion.div>
            </div>
            <div className="footer text-center bg-quaternary py-4">
                <p>Copyright &copy; <a href="https://mataram.pom.go.id">BBPOM di Mataram</a></p>
            </div>
        </div>
    )
}