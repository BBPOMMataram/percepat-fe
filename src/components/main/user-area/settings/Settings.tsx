"use client";

import { showAlert } from "@/features/alertSlice";
import { AppDispatch } from "@/redux/store";
import { User } from "@/types/auth";
import api from "@/utils/api";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";

export default function Settings({ user }: { user: User | null }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const fullNameRef = useRef<HTMLInputElement>(null);
    const formUpdatePasswordRef = useRef<HTMLFormElement>(null);

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

        if (formUpdatePasswordRef.current) {
            const formData = new FormData(formUpdatePasswordRef.current);

            formData.append('_method', 'PATCH');
            api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/update`, formData)
                .then(res => {
                    dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }))
                    setIsEditing(false);
                })
                .catch(err => {
                    dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                });
        }
    }

    return (
        <div className="flex flex-col">
            <form ref={formUpdatePasswordRef} onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow p-8">
                    <div className="flex gap-4 mb-8">
                        <h2 className="text-lg font-semibold text-gray-800">Update Password</h2>

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
                            <label className="text-sm text-gray-500">Password Lama</label>
                            <input type="text" placeholder="Password Lama" className="ar-input-text-purple w-full"
                                readOnly={!isEditing}
                                name="old_password"
                                required={isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Password Baru</label>
                            <input type="text" placeholder="Password Baru" className="ar-input-text-purple w-full"
                                readOnly={!isEditing}
                                name="new_password"
                                required={isEditing}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Konfirmasi Password Baru</label>
                            <input type="text" placeholder="Ketik ulang password baru" className="ar-input-text-purple w-full"
                                readOnly={!isEditing}
                                name="password_confirmation"
                                required={isEditing}
                            />
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
