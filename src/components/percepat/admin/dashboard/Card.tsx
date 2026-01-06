import Link from "next/link"

interface iCard {
    title: string,
    total: number,
    desc: string,
    link: string,
}

const Card = ({ title, total, desc, link }: iCard) => {
    return (
        <Link href={link} className="bg-secondary rounded-lg shadow-lg p-4 m-2 flex-1">
            <div>
                <h2 className="text-xl font-semibold mb-2 text-quaternary">{title}</h2>
                <p className="text-4xl font-bold text-quaternary">{total}</p>
                <p className="text-teriary font-semibold">{desc}</p>
            </div>
        </Link>
    )
}

export default Card