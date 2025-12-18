import { useState } from "react"
import CountUp from "react-countup"

export default function AdminBestEmployee() {
    const [dataDashboard, setDataDashboard] = useState<any>(null)

    // useEffect(() => {
    //     api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_SIAP_MELAYANI}/api/dashboard`)
    //         .then(res => {
    //             setDataDashboard(res.data)
    //         })
    //         .catch(err => {
    //             console.log(err)
    //         })
    // }, [])

    return (
        <>
            <div className="bg-white rounded-2xl shadow px-8 py-4 flex items-center">
                <h2 className="text-xl font-semibold text-gray-800 uppercase">Admin Panel Best Employee</h2>
            </div>

            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-2">
                {/* make content center */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 justify-items-center">
                    <div className="card bg-success text-success-content w-52 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">DATA</h2>
                            <p className="text-4xl lg:text-6xl font-bold flex items-center justify-center">
                                {
                                    <CountUp
                                        end={dataDashboard?.totalPeserta || 0}
                                        duration={1.5}
                                        separator="."
                                    />
                                }
                            </p>
                            <div className="card-actions justify-center">
                                {/* <Link href="/admin/siap-melayani/peserta"> */}
                                <button className="btn btn-success">Check it out</button>
                                {/* </Link> */}
                            </div>
                        </div>
                    </div>
                    <div className="card bg-info text-info-content w-52 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">DATA</h2>
                            <p className="text-4xl lg:text-6xl font-bold flex items-center justify-center">
                                {
                                    <CountUp
                                        end={dataDashboard?.totalPresensiToday || 0}
                                        duration={1.5}
                                        separator="."
                                    />
                                }
                            </p>
                            <div className="card-actions justify-center">
                                {/* <Link href="/admin/siap-melayani/presensi"> */}
                                <button className="btn btn-info">Check it out</button>
                                {/* </Link> */}
                            </div>
                        </div>
                    </div>
                    <div className="card bg-accent text-accent-content w-52 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">DATA</h2>
                            <p className="text-4xl lg:text-6xl font-bold flex items-center justify-center">
                                {
                                    <CountUp
                                        end={dataDashboard?.totalPengajuan || 0}
                                        duration={1.5}
                                        separator="."
                                    />
                                }
                            </p>
                            <div className="card-actions justify-center">
                                {/* <Link href="/admin/siap-melayani/penempatan"> */}
                                <button className="btn btn-accent">Check it out</button>
                                {/* </Link> */}
                            </div>
                        </div>
                    </div>
                    <div className="card bg-warning text-warning-content w-52 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">DATA</h2>
                            <p className="text-4xl lg:text-6xl font-bold flex items-center justify-center">
                                {
                                    <CountUp
                                        end={dataDashboard?.totalKuota || 0}
                                        duration={1.5}
                                        separator="."
                                    />
                                }
                            </p>
                            <div className="card-actions justify-center">
                                {/* <Link href="/admin/siap-melayani/presensi"> */}
                                <button className="btn btn-warning">Check it out</button>
                                {/* </Link> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}