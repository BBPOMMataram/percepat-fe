"use client"

import axios from "@/config/axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GoEye, GoEyeClosed, GoKey } from "react-icons/go";

export default function AuthForm(props: any) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [showPassword, setShowPassword] = useState(false)

    const csrf = () => axios.get('sanctum/csrf-cookie')

    const router = useRouter();
    const handleLogin = async () => {
        await csrf()

        const res = await axios.post('login', {
            email,
            password
        })

        if (!res) {
            console.log('error: ', res);
        }

        router.push('/dashboard')

    }


    return (
        <div className="flex justify-center items-center h-screen text-white">
            <div className="side-img bg-[#227095] h-full flex-1 hidden lg:flex justify-center items-center">
                <Image src={"https://media.giphy.com/media/LkL4dGbQId8ezdHEoX/giphy.gif"} alt="form login animation" width={500} height={500} />
            </div>
            <div className="side-form flex-1 flex justify-center">
                <div className="bg-quaternary rounded px-6 pt-4 pb-6 inline-block">
                    <div className="border-b border-b-secondary mb-4">
                        <GoKey className="mx-auto text-xl" />
                        <h1 className="capitalize text-center my-2 text-2xl">{props.mode} Form</h1>
                    </div>
                    {/* <form action=""> */}
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
                                {!showPassword ? <GoEye /> : <GoEyeClosed />}
                            </div>
                        </div>
                    </div>
                    <div className="text-right mt-6">
                        <button className="bg-secondary text-quaternary hover:bg-teriary hover:text-quaternary font-semibold px-6 py-2 rounded"
                            onClick={handleLogin}
                        >Login</button>
                    </div>
                    {/* </form> */}
                </div>
            </div>
        </div>
    )
}