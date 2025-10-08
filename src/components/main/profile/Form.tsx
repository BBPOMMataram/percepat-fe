"use client";

import { User } from "@/types/auth";
import dayjs from "@/utils/dayjs";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function FormProfile({ user, updateCallName, callName }: { user: User | null, updateCallName: (name: string) => void, callName: string }) {
    const [name, setName] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    return (
        <div className="flex flex-col">
            <div className="bg-white rounded-2xl shadow p-8 mt-6">
                <div className="flex items-center gap-4 mb-8">
                    <Image
                        src={user?.photo_path || "/assets/images/noimage.webp"}
                        alt="Profile photo"
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                    />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <button className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? "Simpan" : "Edit"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm text-gray-500">Full Name</label>
                        <input type="text" placeholder="Full Name" className="ar-input-text-purple w-full"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            readOnly={!isEditing}
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">Nick Name</label>
                        <input type="text" placeholder="Nick Name" className="ar-input-text-purple w-full"
                            value={callName}
                            onChange={(e) => updateCallName(e.target.value)}
                            readOnly={!isEditing}
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-500">NIK</label>
                        <input type="text" placeholder="NIK" className="ar-input-text-purple w-full"
                            value={user?.nik}
                            readOnly={!isEditing}
                        />
                    </div>
                </div>
            </div>

            {/* EMPLOYEE SECTION */}
            {
                user?.employee &&
                <div className="bg-white rounded-2xl shadow px-8 py-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-500">NIP</label>
                            <input type="text" placeholder="NIP" className="ar-input-text-purple w-full"
                                value={user.employee.nip || ""}
                                readOnly={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Gelar Depan</label>
                            <input type="text" placeholder="Gelar Depan" className="ar-input-text-purple w-full"
                                value={user.employee.gelar_depan || ""}
                                readOnly={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Gelar Belakang</label>
                            <input type="text" placeholder="Gelar Belakang" className="ar-input-text-purple w-full"
                                value={user.employee.gelar_belakang || ""}
                                readOnly={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Jabatan</label>
                            <input type="text" placeholder="Jabatan" className="ar-input-text-purple w-full"
                                value={user.employee.jabatan || ""}
                                readOnly={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Golongan</label>
                            <input type="text" placeholder="Golongan" className="ar-input-text-purple w-full"
                                value={user.employee.golongan || ""}
                                readOnly={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Pangkat</label>
                            <input type="text" placeholder="Pangkat" className="ar-input-text-purple w-full"
                                value={user.employee.pangkat || ""}
                                readOnly={!isEditing}
                            />
                        </div>
                    </div>
                </div>
            }

            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-6">
                <div>
                    <p className="text-sm text-gray-400">Join since {user?.created_at ? dayjs(user.created_at).format("DD MMMM YYYY") : "-"}</p>
                    <p className="text-sm text-gray-400 mt-1">
                        <span className="capitalize">{user?.employee && user?.employee.position + " " + user?.employee.unit_kerja}</span>
                        <span>{user?.student && "Mahasiswa"}</span>
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-4">
                <p className="text-sm text-gray-400">
                    Copyright &copy; BBPOM di Mataram {dayjs().format("YYYY")} All rights reserved
                </p>
            </div>
        </div >
    );
}
