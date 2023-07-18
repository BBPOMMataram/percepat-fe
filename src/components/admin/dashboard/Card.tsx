interface iCard {
    title: string,
    total: number,
    desc: string
}

const Card = ({ title, total, desc }: iCard) => {
    return (
        <div className="bg-secondary rounded-lg shadow-lg p-4 m-2 flex-1">
            <h2 className="text-xl font-semibold mb-2 text-quaternary">{title}</h2>
            <p className="text-4xl font-bold text-quaternary">{total}</p>
            <p className="text-teriary font-semibold">{desc}</p>
        </div>
    )
}

export default Card