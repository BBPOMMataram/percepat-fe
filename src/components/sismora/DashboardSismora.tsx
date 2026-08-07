import Link from "next/link";

export default function DashboardSismora() {
    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 flex items-center">
                <h2 className="text-xl font-semibold text-gray-800 uppercase">Dashboard Sismora</h2>
                <div className="tooltip tooltip-left ml-auto" data-tip="Visit Sismora">
                    <a href="/sismora" target="_blank" rel="noopener noreferrer">
                        <span className="material-symbols-outlined">
                            open_in_new
                        </span>
                    </a>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-2">
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <span className="material-symbols-outlined text-6xl mb-4">construction</span>
                    <p className="text-lg font-medium">Halaman ini masih dalam pengembangan</p>
                </div>
            </div>
        </>
    )
}
