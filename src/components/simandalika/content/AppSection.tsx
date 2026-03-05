"use client"
import axios from "@/config/axios";
import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { AppData } from "@/types/app-data";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import AppContainer from "./AppContainer";
import LoadingWithoutText from "@/components/main/loading/LoadingWithoutText";

export default function AppSection() {
    const [dataApp, setDataApp] = useState<AppData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        let isMounted = true

        const fetchAppData = async () => {
            try {
                const { data } = await axios(process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + '/api/site')
                if (isMounted) setDataApp(data.data)
            } catch (error) {
                console.log("Error fetching app data:", error)
                dispatch(showAlert({ type: "error", message: "Error fetching app data", description: "Error fetching app data" }))
            }
            if (isMounted) setIsLoading(false)
        }

        setIsLoading(true)
        fetchAppData()

        return () => {
            isMounted = false
        }
    }, [dispatch])

    return (
        <>
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-4">INOVASI</h2>
                <p className="text-center text-lg mb-4">Inovasi - inovasi Balai Besar POM di Mataram</p>
            </div>
            <div className="flex items-center justify-around gap-28 flex-wrap">
                {
                    isLoading && <LoadingWithoutText /> ||
                    dataApp.map((app, index) => (
                        <AppContainer key={index} appData={app} />
                    ))}
            </div>
        </>
    )
}