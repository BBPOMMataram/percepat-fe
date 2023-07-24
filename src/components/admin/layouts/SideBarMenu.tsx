import { faCaretDown, faCaretLeft, faCartArrowDown, faCartFlatbedSuitcase, faDashboard, faFileAlt } from "@fortawesome/free-solid-svg-icons";
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
            icon: <FontAwesomeIcon icon={faDashboard} />
        },
        {
            name: 'Penerimaan',
            link: '#',
            icon: <FontAwesomeIcon icon={faCartArrowDown} flip="horizontal" />,
            submenus: [
                { name: 'Reagen', link: '/penerimaan/reagen', icon: <FontAwesomeIcon icon={faDashboard} /> },
                { name: 'ATK', link: '/penerimaan/atk', icon: <FontAwesomeIcon icon={faDashboard} /> }
            ]
        },
        {
            name: 'Permintaan',
            link: '/',
            icon: <FontAwesomeIcon icon={faCartFlatbedSuitcase} />
        },
        {
            name: 'Laporan',
            link: '/',
            icon: <FontAwesomeIcon icon={faFileAlt} />
        },
        {
            separator: 'MASTER'
        },
        {
            name: 'Barang',
            link: '/',
            icon: <FontAwesomeIcon icon={faDashboard} />,
            submenus: [
                { name: 'Reagen', link: '#', icon: <FontAwesomeIcon icon={faDashboard} /> },
                { name: 'ATK', link: '#', icon: <FontAwesomeIcon icon={faDashboard} /> }
            ]
        },
        {
            name: 'Bidang',
            link: '/',
            icon: <FontAwesomeIcon icon={faDashboard} />
        },
        {
            name: 'Pengguna',
            link: '/',
            icon: <FontAwesomeIcon icon={faDashboard} />
        },
        {
            separator: 'SETTING'
        },
        {
            name: 'Profile',
            link: '/',
            icon: <FontAwesomeIcon icon={faDashboard} />
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
                                        <a className="flex" onClick={() => handleSubmenu(i)} role="button">
                                            {item.icon}
                                            <span className="ml-2 mr-auto">{item.name}</span>
                                            <button className="ml-5">{submenuOpenStates[i] ? <FontAwesomeIcon icon={faCaretDown} /> : <FontAwesomeIcon icon={faCaretLeft} />}</button>
                                        </a>
                                        <div className='pl-4 pt-2'>
                                            <ul>
                                                {item.submenus.map((submenu) => (
                                                    <AnimatePresence
                                                        key={submenu.name}
                                                    >
                                                        {
                                                            submenuOpenStates[i] &&
                                                            <motion.li
                                                                className={`rounded flex px-2 !pt-0 ${activeClass}`}
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