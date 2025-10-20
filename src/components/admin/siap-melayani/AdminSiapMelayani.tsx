export default function AdminSiapMelayani() {
    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 flex items-center">
                <h2 className="text-xl font-semibold text-gray-800 uppercase">Admin Panel Siap Melayani</h2>
                <div className="tooltip tooltip-right ml-auto" data-tip="Visit Siap Melayani">
                    <a href="/siap-melayani" target="_blank" rel="noopener noreferrer">
                        <span className="material-symbols-outlined">
                            open_in_new
                        </span>
                    </a>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-2">
                {/* make content center */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 justify-items-center">
                    <div className="card bg-success text-success-content w-60 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">Card title!</h2>
                            <p>A card component has a figure, a body part, and inside body there are title and actions parts</p>
                            <div className="card-actions justify-end">
                                <button className="btn btn-success">Check it out</button>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-info text-info-content w-60 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">Card title!</h2>
                            <p>A card component has a figure, a body part, and inside body there are title and actions parts</p>
                            <div className="card-actions justify-end">
                                <button className="btn btn-info">Check it out</button>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-accent text-accent-content w-60 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">Card title!</h2>
                            <p>A card component has a figure, a body part, and inside body there are title and actions parts</p>
                            <div className="card-actions justify-end">
                                <button className="btn btn-accent">Check it out</button>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-warning text-warning-content w-60 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">Card title!</h2>
                            <p>A card component has a figure, a body part, and inside body there are title and actions parts</p>
                            <div className="card-actions justify-end">
                                <button className="btn btn-warning">Check it out</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}