"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { AppData } from "@/types/app-data";
import { User } from "@/types/auth";
import api from "@/utils/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import CardApp from "./CardApp";

export default function OurApps({ user }: { user: User | null }) {
    const [dataApp, setDataApp] = useState<AppData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const dispatch = useDispatch<AppDispatch>()

    const fetchAppData = async () => {
        try {
            const { data } = await api(process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + '/api/site')
            setDataApp(data.data)
        } catch (error) {
            console.log("Error fetching app data:", error)
            dispatch(showAlert({ type: "error", message: "Error fetching app data", description: "Error fetching app data" }))
        }
        setIsLoading(false)
    }

    useEffect(() => {
        setIsLoading(true)
        fetchAppData()
    }, [])

    return (
        <div className="flex flex-col">
            <div className="bg-white rounded-2xl shadow p-8">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Our Apps</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {
                        isLoading && <div>Loading...</div> ||
                        dataApp.map((app, index) => (
                            <CardApp key={index} appData={app} />
                        ))
                    }
                </div>
            </div>

            {/* <div className="bg-white rounded-2xl shadow px-8 py-4 mt-6">
                <div>
                    others stuff here
                </div>
            </div> */}
        </div>
    );
}
