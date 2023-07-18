import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BiCartDownload } from "react-icons/bi";
import { GoDashboard, GoPerson } from "react-icons/go";
import { IoCaretBack, IoCaretDown } from "react-icons/io5";
import { SlChemistry } from "react-icons/sl";
import { TbReportAnalytics } from "react-icons/tb";
import { TfiShoppingCartFull } from "react-icons/tfi";
import { GiBookshelf } from "react-icons/gi";

export default function SideBarMenuItem() {
    const pathname = usePathname()

    const menuItems = [
        {
            name: 'Dasbor',
            link: '/dashboard',
            icon: <GoDashboard />
        },
        {
            name: 'Penerimaan',
            link: '#',
            icon: <BiCartDownload />,
            submenus: [
                { name: 'Reagen', link: '/penerimaan/reagen', icon: <SlChemistry /> },
                { name: 'ATK', link: '/penerimaan/atk', icon: <GiBookshelf /> }
            ]
        },
        {
            name: 'Permintaan',
            link: '/',
            icon: <TfiShoppingCartFull />
        },
        {
            name: 'Laporan',
            link: '/',
            icon: <TbReportAnalytics />
        },
        {
            separator: 'MASTER'
        },
        {
            name: 'Barang',
            link: '/',
            icon: <GoPerson />,
            submenus: [
                { name: 'Reagen', link: '#', icon: <GoPerson /> },
                { name: 'ATK', link: '#', icon: <GoPerson /> }
            ]
        },
        {
            name: 'Bidang',
            link: '/',
            icon: <GoPerson />
        },
        {
            name: 'Pengguna',
            link: '/',
            icon: <GoPerson />
        },
        {
            separator: 'SETTING'
        },
        {
            name: 'Profile',
            link: '/',
            icon: <GoPerson />
        },
    ]

    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false)
    const [isIndexMatch, setIsIndexMatch] = useState<number>()

    const handleSubmenu = (index: number) => {
        setIsSubmenuOpen(!isSubmenuOpen)
        setIsIndexMatch(index)
    }

    return (
        <div className="menu flex-1 my-4 [&_li]:py-2 [&_a]:flex">
            <nav>
                <ul>
                    {
                        menuItems.map((item, i) => {
                            const activeClass = pathname === item.link && 'bg-quaternary';

                            let itemEl =
                                <li key={i} className={`px-2 rounded ${activeClass}`}>
                                    <Link href={item.link || '#'}>
                                        {item.icon} <span className="mx-2">{item.name}</span>
                                    </Link>
                                </li>


                            if (item.separator) {
                                itemEl = <div key={i} className="text-quaternary ml-1 text-sm font-bold">{item.separator}</div>
                            }

                            if (item.submenus) {
                                itemEl =
                                    <li key={i} className="px-2 !pb-0">
                                        <div className="flex">
                                            {item.icon}
                                            <span className="ml-2 mr-auto">{item.name}</span>
                                            <button className="ml-5" onClick={() => handleSubmenu(i)}>{isSubmenuOpen && isIndexMatch === i ? <IoCaretDown /> : <IoCaretBack />}</button>
                                        </div>
                                        <div className='pl-4 pt-2'>
                                            <ul>
                                                {item.submenus.map((submenu) => (
                                                    <AnimatePresence
                                                        key={submenu.name}
                                                    >
                                                        {
                                                            isSubmenuOpen && isIndexMatch === i &&
                                                            <motion.li
                                                                className={`rounded flex px-2 !pt-0 ${activeClass}`}
                                                                initial={{ x: -120 }}
                                                                animate={{ x: 0 }}
                                                                exit={{ x: -120 }}
                                                            >
                                                                <Link href={submenu.link}>
                                                                    {submenu.icon} <span className="ml-2">{submenu.name}</span>
                                                                </Link>
                                                            </motion.li>
                                                        }
                                                    </AnimatePresence>
                                                ))}
                                            </ul>
                                        </div>
                                    </li>
                            }

                            return itemEl
                        })
                    }
                </ul>
            </nav>
        </div >
    )
}