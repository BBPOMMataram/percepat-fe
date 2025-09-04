"use client"
import { AppData } from "@/types/app-data";
import AppContainer from "./AppContainer"
import { useEffect, useState } from "react";
import axios from "@/config/axios";
import LoadingWithoutText from "@/components/percepat/admin/layouts/LoadingWithoutText";

export default function AppSection() {
    const [dataApp, setDataApp] = useState<AppData[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchAppData = async () => {
        try {
            const { data } = await axios('/api/site')
            setDataApp(data.data)
        } catch (error) {
            console.error("Error fetching app data:", error)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        setIsLoading(true)
        fetchAppData()
    }, [])

    return isLoading ? <LoadingWithoutText /> : (
        <>
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-4">INOVASI</h2>
                <p className="text-center text-lg mb-4">Inovasi - inovasi Balai Besar POM di Mataram</p>
            </div>
            <div className="flex items-center justify-around gap-20 flex-wrap">
                {dataApp.map((app, index) => (
                    <AppContainer key={index} appData={app} />
                ))}
            </div>
        </>
    )
}