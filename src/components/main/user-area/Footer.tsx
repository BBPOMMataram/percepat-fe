import dayjs from "dayjs";

export default function FooterUserArea() {
    return (
        <div className="bg-white rounded-2xl shadow px-8 py-4 mt-4">
            <p className="text-xs text-gray-400">
                Copyright &copy; BBPOM di Mataram {dayjs().format("YYYY")} All rights reserved
            </p>
        </div>
    )
}