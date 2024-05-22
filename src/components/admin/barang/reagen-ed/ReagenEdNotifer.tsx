import { fetchDataReagenExpired, reagenActions } from "@/features/reagenSlice"
import { RootState } from "@/redux/store"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

const ReagenEdNotifer = () => {


    const reagenExpired = useSelector((state: RootState) => state.reagenReducer.reagenExpired)

    const dispatch = useDispatch<any>()

    useEffect(() => {
        dispatch(fetchDataReagenExpired())
    })

    return (
        (reagenExpired > 0) &&
        <div className="runtext-container overflow-x-hidden bg-secondary shadow-sm mb-5">
            <a href="/barang/reagen-ed">
                <div className="main-runtext">
                    <div className="marquee">
                        <div className="holder">
                            <div className="text-container">
                                <p className="text-red-500 leading-10">
                                    <b>PEMBERITAHUAN</b>: Reagen ED dalam 6 bulan mendatang berjumlah <strong>{reagenExpired} items</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    )
}

export default ReagenEdNotifer