"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { User } from "@/types/auth";
import api from "@/utils/api";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

export default function Settings({ user }: { user: User | null }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const oldPasswordRef = useRef<HTMLInputElement>(null);
    const formUpdatePasswordRef = useRef<HTMLFormElement>(null);

    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        if (oldPasswordRef.current) {
            oldPasswordRef.current.focus();
        }
    }, [isEditing]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formUpdatePasswordRef.current) {
            const formData = new FormData(formUpdatePasswordRef.current);

            formData.append('_method', 'PATCH');
            api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/update-password`, formData)
                .then(res => {
                    dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                    setIsEditing(false);
                })
                .catch(err => {
                    dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                    console.log(err);

                });
        }
    }

    return (
        <div className="flex flex-col">
            <form ref={formUpdatePasswordRef} onSubmit={handleSubmit} autoComplete="off">
                <div className="bg-white rounded-2xl shadow p-8">
                    <div className="flex gap-4 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800">Update Password</h2>

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
                        <div className="relative">
                            <label className="text-sm text-gray-500">Password Lama</label>
                            <input placeholder="Password Lama" className="ar-input-text-green w-full"
                                type={showOldPassword ? "text" : "password"}
                                readOnly={!isEditing}
                                name="old_password"
                                required={isEditing}
                                ref={oldPasswordRef}
                            />
                            <button
                                tabIndex={-1}
                                type="button"
                                className="absolute right-3 top-9"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                            >
                                {
                                    showConfirmPassword ?
                                        <span className="material-symbols-outlined !text-[20px]">visibility_off</span>
                                        : <span className="material-symbols-outlined !text-[20px]">visibility</span>
                                }
                            </button>
                        </div>
                        <div className="relative">
                            <label className="text-sm text-gray-500">Password Baru</label>
                            <input placeholder="Password Baru" className="ar-input-text-green w-full"
                                type={showNewPassword ? "text" : "password"}
                                readOnly={!isEditing}
                                name="new_password"
                                required={isEditing}
                            />
                            <button
                                tabIndex={-1}
                                type="button"
                                className="absolute right-3 top-9"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {
                                    showConfirmPassword ?
                                        <span className="material-symbols-outlined !text-[20px]">visibility_off</span>
                                        : <span className="material-symbols-outlined !text-[20px]">visibility</span>
                                }
                            </button>
                        </div>
                        <div className="relative">
                            <label className="text-sm text-gray-500">Konfirmasi Password Baru</label>
                            <input placeholder="Ketik ulang password baru" className="ar-input-text-green w-full"
                                type={showConfirmPassword ? "text" : "password"}
                                readOnly={!isEditing}
                                name="new_password_confirmation"
                                required={isEditing}
                            />
                            <button
                                tabIndex={-1}
                                type="button"
                                className="absolute right-3 top-9"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {
                                    showConfirmPassword ?
                                        <span className="material-symbols-outlined !text-[20px]">visibility_off</span>
                                        : <span className="material-symbols-outlined !text-[20px]">visibility</span>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* <div className="bg-white rounded-2xl shadow px-8 py-4 mt-6">
                <div>
                    others stuff here
                </div>
            </div> */}
        </div>
    );
}
