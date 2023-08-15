import { faBoxesStacked, faCaretDown, faCaretLeft, faCartArrowDown, faCartFlatbedSuitcase, faDashboard, faFileAlt, faFilePen, faFlaskVial, faPuzzlePiece, faUserGear, faUserGroup, faUsers, faWarehouse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function SideBarMenuItem() {
    const pathname = usePathname()

    const menuItems = [
        {
            name: 'Dasbor',
            link: '/dashboard',
            icon: <FontAwesomeIcon icon={faDashboard} fixedWidth />
        },
        {
            name: 'Penerimaan',
            link: '#',
            icon: <FontAwesomeIcon icon={faCartArrowDown} fixedWidth flip="horizontal" />,
            submenus: [
                { name: 'Reagen', link: '/penerimaan/reagen', icon: <FontAwesomeIcon icon={faFlaskVial} fixedWidth /> },
                { name: 'ATK', link: '/penerimaan/atk', icon: <FontAwesomeIcon icon={faFilePen} fixedWidth /> }
            ]
        },
        {
            name: 'Permintaan',
            link: '/',
            icon: <FontAwesomeIcon icon={faCartFlatbedSuitcase} fixedWidth />,
            submenus: [
                { name: 'Reagen', link: '/permintaan/reagen', icon: <FontAwesomeIcon icon={faFlaskVial} fixedWidth /> },
                { name: 'ATK', link: '/permintaan/atk', icon: <FontAwesomeIcon icon={faFilePen} fixedWidth /> }
            ]
        },
        {
            name: 'Laporan',
            link: '/',
            icon: <FontAwesomeIcon icon={faFileAlt} fixedWidth />
        },
        {
            separator: 'MASTER'
        },
        {
            name: 'Barang',
            link: '/',
            icon: <FontAwesomeIcon icon={faBoxesStacked} fixedWidth />,
            submenus: [
                { name: 'Reagen', link: '#', icon: <FontAwesomeIcon icon={faFlaskVial} fixedWidth /> },
                { name: 'ATK', link: '#', icon: <FontAwesomeIcon icon={faFilePen} fixedWidth /> }
            ]
        },
        {
            name: 'Bidang',
            link: '/bidang',
            icon: <FontAwesomeIcon icon={faPuzzlePiece} fixedWidth />
        },
        {
            name: 'Pengguna',
            link: '/users',
            icon: <FontAwesomeIcon icon={faUserGroup} fixedWidth />
        },
        {
            separator: 'SETTING'
        },
        {
            name: 'Profile',
            link: '/',
            icon: <FontAwesomeIcon icon={faUserGear} fixedWidth />
        },
    ]

    const [submenuOpenStates, setSubmenuOpenStates] = useState(() => {
        // Initialize all submenu states to false (closed) by default
        return menuItems.map(item => Boolean(!item.submenus));
    });

    // Function to toggle the open/close state of a specific submenu
    const handleSubmenu = (index: number) => {
        setSubmenuOpenStates(prevState => {
            const newStates = [...prevState];
            newStates[index] = !newStates[index];
            return newStates;
        });
    };

    return (
        <div className="menu flex-1 my-4 [&_li]:py-2 [&_li]:px-4 [&_a]:flex [&_a]:items-center">
            <nav>
                <ul>
                    {
                        menuItems.map((item, i) => {
                            const activeClass = pathname === item.link ? 'bg-quaternary' : 'hover:bg-secondary' ;

                            let itemEl =
                                <li key={i} className={activeClass}>
                                    <Link href={item.link || '#'}>
                                        <span className="text-xl">{item.icon}</span> <span className="mx-2">{item.name}</span>
                                    </Link>
                                </li>


                            if (item.separator) {
                                itemEl = <div key={i} className="text-quaternary ml-2 text-sm font-bold">{item.separator}</div>
                            }

                            if (item.submenus) {
                                itemEl =
                                    <li key={i} className={`!pb-0 ${submenuOpenStates[i] ? '' : 'hover:bg-secondary'}`}>
                                        <a className="flex" onClick={() => handleSubmenu(i)} role="button">
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="ml-2 mr-auto">{item.name}</span>
                                            <button className="ml-6">{submenuOpenStates[i] ? <FontAwesomeIcon icon={faCaretDown} /> : <FontAwesomeIcon icon={faCaretLeft} />}</button>
                                        </a>
                                        <div className='pl-4 pt-2'>
                                            <ul>
                                                {item.submenus.map((submenu) => {
                                                    const activeClassSubmenu = pathname === submenu.link ? 'bg-quaternary' : 'hover:bg-secondary';

                                                    return (
                                                        <AnimatePresence
                                                            key={submenu.name}
                                                        >
                                                            {
                                                                submenuOpenStates[i] &&
                                                                <motion.li
                                                                    className={activeClassSubmenu}
                                                                    initial={{ x: -120 }}
                                                                    animate={{ x: 0 }}
                                                                    exit={{ x: -120, transition: { duration: .1 } }}
                                                                >
                                                                    <Link href={submenu.link}>
                                                                        {submenu.icon} <span className="ml-2">{submenu.name}</span>
                                                                    </Link>
                                                                </motion.li>
                                                            }
                                                        </AnimatePresence>
                                                    )
                                                })}
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