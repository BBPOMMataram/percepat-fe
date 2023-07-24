"use client"
import { toggleSideBar } from "@/features/layout/sideBarSlice";
import { RootState } from "@/redux/store";
import { faExternalLink, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SideBarMenu from "./SideBarMenu";

export default function SideBar() {
    const isSideBarOpen = useSelector((state: RootState) => state.sideBar.isSideBarOpen)
    const dispatch = useDispatch()

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 639px)');
        const handleResize = () => {
            // close if window less than 640px otherwise open
            if (mediaQuery.matches) {
                if (isSideBarOpen) {
                    dispatch(toggleSideBar())
                }
            } else {
                if (!isSideBarOpen) {
                    dispatch(toggleSideBar())
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    })

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
                        <Link href={'/'} title="Homepage"><FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2" /></Link>
                    </div>
                    <SideBarMenu />
                </div>
            </motion.div>
        </AnimatePresence>
    ) : null
}