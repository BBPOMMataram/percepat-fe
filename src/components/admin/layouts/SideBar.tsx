"use client"
import Image from "next/image";
import SideBarMenuItem from "./SideBarMenuItem";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { AnimatePresence, motion } from "framer-motion";

export default function SideBar() {
    const isSideBarOpen = useSelector((state: RootState) => state.sideBar.isSideBarOpen)

    return isSideBarOpen ? (
        <AnimatePresence>
            <motion.div
                className="flex-1 flex flex-col"
                initial={{ x: -100 }}
                animate={{ x: 0, transition: { type: 'tween' } }}
                exit={{ x: -100 }}
            >
                <div className="flex-1 flex flex-col bg-teriary py-4 px-2">
                    <div className="header text-center border-b border-quaternary pb-3">
                        <Image src={"/assets/images/bpom.png"} alt="Logo BPOM RI" width={50} height={50} className="mx-auto mb-2" />
                        <strong>PERCEPAT</strong>
                    </div>
                    <SideBarMenuItem />
                </div>
                <div className="footer border-t border-quaternary bg-teriary p-4">
                    <p>BBPOM di Mataram</p>
                </div>
            </motion.div>
        </AnimatePresence>
    ) : null
}