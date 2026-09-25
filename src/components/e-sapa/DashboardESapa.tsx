"use client";

import dayjs from "@/utils/dayjs";
import api from "@/utils/api";
import { useEffect, useState } from "react";

export default function DashboardESapa() {
    const [dashboardData, setDashboardData] = useState({
        countStToday: 0,
        countStThisMonth: 0,
        countStThisYear: 0,
        countPetugas: 0
    });

    useEffect(() => {
        // Cukup panggil URL API. Axios otomatis membawa cookie karena withCredentials: true
        api.get('http://localhost:8001/api/dashboard')
            .then((res) => {
                if (res.data && res.data.data) {
                    setDashboardData(res.data.data);
                }
            })
            .catch((err) => {
                console.error("Gagal mengambil data dashboard:", err);
            });
    }, []);

    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto sm:px-2 lg:px-4">
                <div className="boxes grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mx-8">
                    <div className="card bg-primary text-primary-content">
                        <div className="card-body">
                            <h2 className="card-title">Surat Tugas Hari ini</h2>
                            <p>Jumlah surat tugas yang dibuat hari ini</p>
                            <div className="card-actions justify-end">
                                <button className="btn btn-circle">{dashboardData.countStToday}</button>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-secondary text-secondary-content">
                        <div className="card-body">
                            <h2 className="card-title">Surat Tugas Bulan ini</h2>
                            <p>Jumlah surat tugas yang dibuat bulan <b>{dayjs().format('MMMM YYYY')}</b></p>
                            <div className="card-actions justify-end">
                                <button className="btn btn-circle">{dashboardData.countStThisMonth}</button>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-neutral text-neutral-content">
                        <div className="card-body">
                            <h2 className="card-title">Surat Tugas Tahun ini</h2>
                            <p>Jumlah surat tugas yang dibuat tahun <b>{dayjs().format('YYYY')}</b></p>
                            <div className="card-actions justify-end">
                                <button className="btn btn-circle">{dashboardData.countStThisYear}</button>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-accent text-accent-content">
                        <div className="card-body">
                            <h2 className="card-title">Petugas</h2>
                            <p>Jumlah petugas yang terdaftar</p>
                            <div className="card-actions justify-end">
                                <button className="btn btn-circle">{dashboardData.countPetugas}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}