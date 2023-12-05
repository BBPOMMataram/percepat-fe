"use client"

import { useAuth } from "@/hooks/useAuth";
import { RootState } from "@/redux/store";
import { faEye, faEyeSlash, faSpinner, faUnlockKeyhole } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";

export default function AuthForm(props: any) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [shouldRemember, setShouldRemember] = useState(false)
    const [errors, setErrors] = useState<any>([])
    const [status, setStatus] = useState(null)
    const [errorMessage, setErrorMessage] = useState()

    const isLoading = useSelector((state: RootState) => state.settingReducer.isLoading)

    const { login } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/dashboard',
    })

    const handleLogin = async (e: any) => {
        e.preventDefault()

        login({
            email,
            password,
            remember: shouldRemember,
            setErrors,
            setStatus,
        })
    }

    useEffect(() => {
        if (errors) {
            setErrorMessage(errors.email && errors.email[0] || errors.password && errors.password[0])

            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
    }, [errorMessage, errors])

    return (
        <div className="flex justify-center items-center h-screen text-white">
            <ToastContainer />
            <div className="side-img bg-[#227095] h-full flex-1 hidden lg:flex justify-center items-center">
                <Image src={"https://media.giphy.com/media/LkL4dGbQId8ezdHEoX/giphy.gif"} alt="form login animation" width={500} height={500} />
            </div>
            <div className="side-form flex-1 flex justify-center">
                <div className="bg-quaternary rounded px-6 pt-4 pb-6 inline-block">
                    <div className="border-b border-b-secondary mb-4 text-center">
                        {/* <GoKey className="mx-auto text-xl" /> */}
                        <FontAwesomeIcon icon={faUnlockKeyhole} />
                        <h1 className="capitalize my-2 text-2xl">{props.mode} Form</h1>
                    </div>
                    <form onSubmit={handleLogin}>
                        <div className="flex flex-col mb-2">
                            <label htmlFor="email">Username / email</label>
                            <input className="p-2 bg-secondary text-quaternary focus:outline-none"
                                type="text"
                                placeholder="Username / email"
                                id="email"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col mb-2">
                            <label htmlFor="password">Password</label>
                            <div className="flex bg-secondary items-center">
                                <input className="p-2 bg-secondary text-quaternary focus:outline-none"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    id="password"
                                    value={password}
                                    onChange={(e: any) => setPassword(e.target.value)}
                                />
                                <div role="button" className="text-quaternary border-l border-teriary w-8 flex justify-center" onClick={() => setShowPassword(!showPassword)}>
                                    {!showPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                                </div>
                            </div>
                        </div>
                        <div className="">
                            <label htmlFor="remember-me" className="inline-flex">
                                <input
                                    type="checkbox"
                                    className="mr-1 "
                                    onChange={(e) => setShouldRemember(e.target.checked)}
                                />
                                remember me
                            </label>
                        </div>
                        <div className="text-right mt-6">
                            <button className="bg-secondary text-quaternary hover:bg-teriary hover:text-quaternary font-semibold px-6 py-2 rounded"
                                disabled={isLoading ? true : false}>
                                Login {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : ""}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}