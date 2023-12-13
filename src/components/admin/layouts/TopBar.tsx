"use client"

import { toggleSideBar } from "@/features/layout/sideBarSlice";
import { toggleUserMenu } from "@/features/layout/topBarSlice";
import { useAuth } from "@/hooks/useAuth";
import { RootState } from "@/redux/store";
import { faBars, faDoorOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

    const [position, setPosition] = useState(user.data.position)

    //POSITION
    useEffect(() => {
        switch (position) {
            case 'kasubbagumum':
                setPosition('kabag tu')
                break;
            case 'penyerah':
                setPosition('petugas gudang')
                break;
            case 'penyelia':
                setPosition('penyelia')
                break;
            case 'pemohon':
                setPosition('pemohon')
                break;

            default:
                setPosition('No position')
                break;
        }
    }, [user])

    return (
        <div className="flex items-center bg-quaternary py-4 px-4">
            <button onClick={() => dispatch(toggleSideBar())} className="burger-btn">
                <FontAwesomeIcon icon={faBars} size="2xl" />
            </button>
            <div className="ml-auto">
                <div className="relative">
                    <button ref={userBtnMenuRef} className="flex items-center bg-secondary rounded px-3 py-1 outline-none" onClick={() => dispatch(toggleUserMenu())}>
                        <Image src={user?.data?.photo || '/assets/images/noimage.webp'} alt="profile photo" width={100} height={100}
                            className="rounded-full mr-2 w-12 h-12"
                        />
                        <div className="flex flex-col h-fit">
                            <span>{user?.data?.name}</span>
                            <span className="text-quaternary uppercase text-xs">{position}</span>
                        </div>
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
                                <Image src={user?.data?.photo || '/assets/images/noimage.webp'} alt="profile photo" width={100} height={100}
                                    className="rounded-full mx-auto shadow-lg"
                                />
                                <div className="text-center mt-2 text-secondary font-semibold uppercase">
                                    <span>
                                        {position}
                                    </span>
                                    <span className="block text-sm whitespace-nowrap">{user.data.bidang?.name || 'No Komoditi'}</span>
                                </div>
                                <div className="text-center text-quaternary">
                                    {user?.data?.email}
                                </div>
                                <button className="flex border-t border-quaternary text-quaternary pt-2 mt-3 pr-3 font-bold ml-auto outline-none" onClick={logout}>
                                    {/* <GiExitDoor title="Logout" />  */}
                                    Keluar
                                    <FontAwesomeIcon icon={faDoorOpen} className="ml-1" />
                                </button>
                            </motion.div>
                        }
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}