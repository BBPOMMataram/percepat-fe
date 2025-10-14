import dayjs from "dayjs";

export default function Footer() {
    return (
        <div className="bg-white rounded-2xl shadow px-8 py-4 mt-4">
            <p className="text-sm text-gray-400">
                Copyright &copy; BBPOM di Mataram {dayjs().format("YYYY")} All rights reserved
            </p>
        </div>
    )
}