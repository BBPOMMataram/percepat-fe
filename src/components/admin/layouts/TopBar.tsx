"use client"

import { toggleSideBar } from "@/features/layout/sideBarSlice";
import { toggleUserMenu } from "@/features/layout/topBarSlice";
import { useAuth } from "@/hooks/auth";
import { RootState } from "@/redux/store";
import { faBars, faDoorOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

const useClickOutside = (ref: any, refUserBtn: any) => {
    const dispatch = useDispatch()
    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (ref.current && !ref.current.contains(e.target) && !refUserBtn.current.contains(e.target)) {
                dispatch(toggleUserMenu())
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [ref, refUserBtn, dispatch])
}


export default function TopBar() {
    const { user, logout } = useAuth({ middleware: 'auth' })
    const isUserMenuOpen = useSelector((state: RootState) => state.topBar.isUserMenuOpen)

    const dispatch = useDispatch()
    const userMenuRef = useRef(null)
    const userBtnMenuRef = useRef(null)
    useClickOutside(userMenuRef, userBtnMenuRef)

    return (
        <div className="flex items-center bg-quaternary py-4 px-2">
            <button onClick={() => dispatch(toggleSideBar())} className="burger-btn">
                <FontAwesomeIcon icon={faBars} size="2xl" />
            </button>
            <div className="ml-auto">
                <div className="relative">
                    <button ref={userBtnMenuRef} className="flex items-center bg-secondary rounded px-3 py-2" onClick={() => dispatch(toggleUserMenu())}>
                        <Image src={'/assets/images/bpom.png'} alt="profile photo" width={25} height={25}
                            className="rounded-full bg-teriary mr-2 w-7 h-7"
                        />
                        <span>{user?.name}</span>
                    </button>
                    <AnimatePresence>
                        {
                            isUserMenuOpen &&
                            <motion.div
                                className={`absolute right-0 top-[52px] bg-teriary py-2 px-4 rounded`}
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                ref={userMenuRef}
                            >
                                <div>
                                    {user?.email}
                                </div>
                                <button className="flex border-t border-quaternary pt-2 mt-3 pr-3" onClick={logout}>
                                    {/* <GiExitDoor title="Logout" />  */}
                                    <FontAwesomeIcon icon={faDoorOpen} className="mr-1" />
                                    Keluar
                                </button>
                            </motion.div>
                        }
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}