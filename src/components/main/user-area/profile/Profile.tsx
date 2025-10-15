"use client";

import { showAlert } from "@/features/alertSlice";
import { getUser } from "@/features/authSlice";
import { AppDispatch } from "@/redux/store";
import { User } from "@/types/auth";
import api from "@/utils/api";
import dayjs from "@/utils/dayjs";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import SignatureCanvas from "react-signature-canvas";

export default function Profile({ user, updateCallName, callName }: { user: User | null, updateCallName: (name: string) => void, callName: string }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const fullNameRef = useRef<HTMLInputElement>(null);
    const formProfileRef = useRef<HTMLFormElement>(null);
    const signatureSelectRef = useRef<any>(null)

    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    useEffect(() => {
        if (fullNameRef.current) {
            fullNameRef.current.focus();
        }
    }, [isEditing]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formProfileRef.current) {
            const formData = new FormData(formProfileRef.current);
            // Get the signature data URL
            const signatureDataURL = signatureSelectRef.current.toDataURL();

            // jika kosong, berarti user tidak mengubah tanda tangan, maka tidak usah dikirim ke backend
            if (!signatureSelectRef.current.isEmpty()) {
                formData.append('signature_path', signatureDataURL);
            }

            formData.append('_method', 'PATCH');
            api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/update-profile`, formData)
                .then(res => {
                    dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                    dispatch(getUser());
                    setIsEditing(false);
                })
                .catch(err => {
                    dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                });
        }
    }

    return (
        <div className="flex flex-col">
            <form ref={formProfileRef} onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow p-8">
                    <div className="flex gap-4 mb-8">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                <Image
                                    src={user?.photo_path || "/assets/images/noimage.webp"}
                                    alt="Profile photo"
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
                                    <p className="text-sm text-gray-500">{email}</p>
                                </div>
                            </div>
                            {isEditing &&
                                <div className="text-xs flex flex-col">
                                    <label htmlFor="photo_path">Update Photo</label>
                                    <input type="file" name="photo_path" className="ar-input-text-green text-xs w-32" />
                                </div>
                            }
                        </div>

                        <div className="ml-auto">
                            {isEditing ?
                                <>
                                    <button className="btn btn-error mx-2"
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        <span className="material-symbols-outlined !text-[20px]">
                                            cancel
                                        </span>
                                    </button>
                                    <button className="btn btn-primary"
                                        type="submit"
                                    >
                                        <span className="material-symbols-outlined !text-[20px]">
                                            save
                                        </span>
                                    </button>
                                </>
                                :
                                <button
                                    className="btn btn-error tooltip tooltip-top"
                                    data-tip="Edit"
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <span className="material-symbols-outlined !text-[20px]">
                                        edit
                                    </span>
                                </button>
                            }
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm text-gray-500">Nama lengkap</label>
                            <input type="text" placeholder="Nama lengkap" className="ar-input-text-green w-full"
                                ref={fullNameRef}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                readOnly={!isEditing}
                                name="name"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Email</label>
                            <input type="text" placeholder="Email" className="ar-input-text-green w-full"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                readOnly={!isEditing}
                                name="email"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Nama panggilan</label>
                            <input type="text" placeholder="Nama panggilan" className="ar-input-text-green w-full"
                                value={callName}
                                onChange={(e) => updateCallName(e.target.value)}
                                readOnly={!isEditing}
                                name="call_name"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">NIK</label>
                            <input type="text" placeholder="NIK" className="ar-input-text-green w-full"
                                defaultValue={user?.nik || ""}
                                readOnly={!isEditing}
                                name="nik"
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
                                <input type="text" placeholder="NIP" className="ar-input-text-green w-full"
                                    defaultValue={user.employee.nip || ""}
                                    readOnly={!isEditing}
                                    name="employee[nip]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Gelar Depan</label>
                                <input type="text" placeholder="Gelar Depan" className="ar-input-text-green w-full"
                                    defaultValue={user.employee.gelar_depan || ""}
                                    readOnly={!isEditing}
                                    name="employee[gelar_depan]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Gelar Belakang</label>
                                <input type="text" placeholder="Gelar Belakang" className="ar-input-text-green w-full"
                                    defaultValue={user.employee.gelar_belakang || ""}
                                    readOnly={!isEditing}
                                    name="employee[gelar_belakang]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Jabatan</label>
                                <input type="text" placeholder="Jabatan" className="ar-input-text-green w-full"
                                    defaultValue={user.employee.jabatan || ""}
                                    readOnly={!isEditing}
                                    name="employee[jabatan]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Golongan</label>
                                <input type="text" placeholder="Golongan" className="ar-input-text-green w-full"
                                    defaultValue={user.employee.golongan || ""}
                                    readOnly={!isEditing}
                                    name="employee[golongan]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Pangkat</label>
                                <input type="text" placeholder="Pangkat" className="ar-input-text-green w-full"
                                    defaultValue={user.employee.pangkat || ""}
                                    readOnly={!isEditing}
                                    name="employee[pangkat]"
                                />
                            </div>
                        </div>
                    </div>
                }

                {/* STUDENT SECTION */}
                {
                    user?.student &&
                    <div className="bg-white rounded-2xl shadow px-8 py-4 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm text-gray-500">Universitas</label>
                                <input type="text" placeholder="Universitas" className="ar-input-text-green w-full"
                                    defaultValue={user.student.university || ""}
                                    readOnly={!isEditing}
                                    name="student[university]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Jurusan</label>
                                <input type="text" placeholder="Jurusan" className="ar-input-text-green w-full"
                                    defaultValue={user.student.jurusan || ""}
                                    readOnly={!isEditing}
                                    name="student[jurusan]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">NIM</label>
                                <input type="text" placeholder="NIM" className="ar-input-text-green w-full"
                                    defaultValue={user.student.nim || ""}
                                    readOnly={!isEditing}
                                    name="student[nim]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Angkatan</label>
                                <input type="text" placeholder="Angkatan" className="ar-input-text-green w-full"
                                    defaultValue={user.student.angkatan || ""}
                                    readOnly={!isEditing}
                                    name="student[angkatan]"
                                />
                            </div>
                        </div>
                    </div>
                }

                <div className="bg-white rounded-2xl shadow px-8 py-4 mt-6">
                    <div>
                        {isEditing ?
                            <>
                                <label className="block text-sm font-medium text-gray-700 mb-4">
                                    Ubah Tanda Tangan
                                </label>
                                <SignatureCanvas
                                    canvasProps={{
                                        className: '',
                                        width: 160, // 40 * 4 (karena Tailwind w-40 = 10rem = 160px)
                                        height: 160,
                                    }}
                                    ref={signatureSelectRef}
                                />
                                <button className="mt-1 w-fit text-red-500 flex items-center justify-start gap-1 text-sm" type="button" onClick={() => signatureSelectRef.current.clear()}>
                                    <span className="material-symbols-outlined !text-[20px]">
                                        change_circle
                                    </span> <span>Clear</span>
                                </button>
                            </> :
                            <>
                                <label className="block text-sm font-medium text-gray-700">
                                    Tanda Tangan
                                </label>
                                <Image
                                    src={user?.signature_path || "/assets/images/noimage.webp"}
                                    alt="Profile photo"
                                    width={64}
                                    height={64}
                                    className="w-30 h-30 object-contain"
                                />
                            </>
                        }
                    </div>
                </div>
            </form>

            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-6">
                <div>
                    <p className="text-sm text-gray-400">Join since {user?.created_at ? dayjs(user.created_at).format("DD MMMM YYYY") : "-"}</p>
                    <p className="text-sm text-gray-400 mt-1">
                        <span className="capitalize">{user?.employee && `${user?.employee.position} ${user?.employee.fungsi?.name} ${user?.employee.unit_kerja}`}</span>
                        <span>{user?.student && `Mahasiswa PKL ${user?.student.university}`}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
