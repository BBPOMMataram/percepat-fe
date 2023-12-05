"use client"

import axios from "@/config/axios"
import { useAuth } from "@/hooks/useAuth"
import { faArrowLeft, faEye, faEyeSlash, faKey, faPen, faRotateBack, faSave } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import ReactSignatureCanvas from "react-signature-canvas"
import { toast } from "react-toastify"

export default function Profile() {
    const { user } = useAuth({ middleware: 'auth' })

    const [editable, setEditable] = useState(false)
    const [editableSign, setEditableSign] = useState(false)
    const [name, setName] = useState(user.data.name)
    const [email, setEmail] = useState(user.data.email)
    const [signature, setSignature] = useState(user.data.signature)
    const [newPhoto, setNewPhoto] = useState<any>(null) //UNTUK PREVIEW
    const [newPhotoBlob, setNewPhotoBlob] = useState<any>(null)
    const [isUpdatePassword, setIsUpdatePassword] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("")
    const [isShowPassword, setIsShowPassword] = useState(false)
    const [isShowNewPassword, setIsShowNewPassword] = useState(false)
    const [isShowNewPasswordConfirmation, setIsShowNewPasswordConfirmation] = useState(false)

    const signatureSelectRef = useRef<any>(null)
    const nameRef = useRef<any>(null)

    useEffect(() => {
        if (editable) {
            nameRef.current.focus()
        }
    }, [editable])

    const cancelEditHandler = () => {
        setName(user.data.name)
        setEmail(user.data.email)
        setEditable(false)
        setNewPhotoBlob(null)
        setNewPhoto(null)
    }

    const updateHandler = () => {
        const formData = new FormData()
        formData.append('_method', 'PATCH')
        formData.append('name', name)
        formData.append('email', email)

        if (editableSign) {
            formData.append('signature', signatureSelectRef.current.toDataURL())
            if (signatureSelectRef.current.isEmpty()) {
                toast.success('TTD dulu !', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });

                return
            }
        }

        if (newPhotoBlob) {
            formData.append('photo', newPhotoBlob)
        }

        axios.post(`/api/profile/${user.data.id}`, formData)
            .then(({ data }) => {
                toast.success(data.msg, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });

                setEditable(false)
                setEditableSign(false)
                setNewPhotoBlob(null)
                editableSign && setSignature(signatureSelectRef.current.toDataURL())
            })
            .catch((response) => {
                const errors = response.response.data.errors || response

                // get all fields in errors as array
                const errorMessagesArray = Object.keys(errors)

                let autoCloseTime = 5000
                // loop all error fields exist
                errorMessagesArray.forEach(errorItem => {
                    // loop all items error each field
                    errors[errorItem].forEach((errorMessage: string) => {
                        toast.error(errorMessage, {
                            position: "top-right",
                            autoClose: autoCloseTime,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: "light",
                        });
                        autoCloseTime += 1000
                    });
                })
            })
    }

    const updatePasswordHandler = () => {
        const formData = new FormData()
        formData.append('_method', 'PATCH')
        formData.append('currentPassword', currentPassword)
        formData.append('newPassword', newPassword)
        formData.append('newPassword_confirmation', newPasswordConfirmation)

        axios.post(`/api/profile/update-password`, formData)
            .then(({ data }) => {
                toast.success(data.msg, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                });

            })
            .catch((response) => {
                const errors = response.response.data.errors || response

                // get all fields in errors as array
                const errorMessagesArray = Object.keys(errors)

                let autoCloseTime = 5000
                // loop all error fields exist
                errorMessagesArray.forEach(errorItem => {
                    // loop all items error each field
                    errors[errorItem].forEach((errorMessage: string) => {
                        toast.error(errorMessage, {
                            position: "top-right",
                            autoClose: autoCloseTime,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: "light",
                        });
                        autoCloseTime += 1000
                    });
                })
            })
    }

    return (
        <section className="p-4">
            <div className="bg-teriary flex flex-col items-center lg:flex-row p-2 rounded bg-opacity-90 shadow-xl">
                <div className="flex-1 text-center">
                    <label htmlFor="photo" className="relative cursor-pointer">
                        <div className="relative group">
                            <Image
                                src={newPhoto || user.data.photo || '/assets/images/noimage.webp'}
                                width={400}
                                height={400}
                                alt={`Photo ${user.data.name}`}
                                className="rounded-full w-[20rem] h-[20rem] mx-auto"
                            />
                            {
                                !newPhotoBlob &&
                                <div className="rounded-full w-[20rem] h-[20rem] mx-auto bg-black opacity-0 group-hover:opacity-50 absolute inset-0 flex justify-center items-center">
                                    <FontAwesomeIcon icon={faPen} className="text-2xl text-quaternary" role="button" />
                                </div>
                            }
                        </div>
                        <input
                            type="file"
                            id="photo"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                    setNewPhoto(URL.createObjectURL(files[0]));
                                    setNewPhotoBlob(files[0]);
                                }
                            }}
                        />
                    </label>
                    {
                        newPhotoBlob &&
                        <>
                            <FontAwesomeIcon title="Batal" icon={faRotateBack} className="my-2 text-quaternary mr-2" role="button" onClick={cancelEditHandler} />
                            <FontAwesomeIcon title="Simpan" icon={faSave} className="my-2 text-quaternary" role="button" onClick={updateHandler} />
                        </>
                    }
                    <div className="uppercase font-bold mt-2">{`${user.data.position || 'No Position'} - ${user.data.bidang?.name || 'No Komoditi'}`}</div>
                    <div className="uppercase font-bold">BBPOM di Mataram</div>
                    <div className="">
                        {
                            isUpdatePassword ?
                                <>
                                    <FontAwesomeIcon title="Batal" icon={faRotateBack} className="my-2 text-quaternary mr-2" role="button" onClick={() => setIsUpdatePassword(!isUpdatePassword)} />
                                    <FontAwesomeIcon title="Simpan" icon={faSave} className="my-2 text-quaternary" role="button" onClick={updatePasswordHandler} />
                                </>
                                :
                                <FontAwesomeIcon title="Ubah Password" icon={faKey} className="my-2 text-quaternary" role="button" onClick={() => setIsUpdatePassword(!isUpdatePassword)} />
                        }</div>

                    {isUpdatePassword &&
                        <div className="flex flex-col items-center">
                            {/* input item */}
                            <div className="flex flex-col mb-2 w-fit">
                                <label htmlFor="currentPassword">Password saat ini</label>
                                <div className="flex bg-secondary items-center rounded">
                                    <input className="p-2 bg-secondary text-quaternary rounded focus:outline-none"
                                        type={isShowPassword ? "text" : "password"}
                                        placeholder="Password saat ini"
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e: any) => setCurrentPassword(e.target.value)}
                                    />
                                    <div role="button" className="text-quaternary border-l border-teriary w-8 flex justify-center" onClick={() => setIsShowPassword(!isShowPassword)}>
                                        {!isShowPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                                    </div>
                                </div>
                            </div>
                            {/* input item */}
                            <div className="flex flex-col mb-2 w-fit">
                                <label htmlFor="newPassword">Password baru</label>
                                <div className="flex bg-secondary items-center rounded">
                                    <input className="p-2 bg-secondary text-quaternary rounded focus:outline-none"
                                        type={isShowNewPassword ? "text" : "password"}
                                        placeholder="Password baru"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e: any) => setNewPassword(e.target.value)}
                                    />
                                    <div role="button" className="text-quaternary border-l border-teriary w-8 flex justify-center" onClick={() => setIsShowNewPassword(!isShowNewPassword)}>
                                        {!isShowNewPassword ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                                    </div>
                                </div>
                            </div>
                            {/* input item */}
                            <div className="flex flex-col mb-2 w-fit">
                                <label htmlFor="newPasswordConfirmation">Konfirmasi password baru</label>
                                <div className="flex bg-secondary items-center rounded">
                                    <input className="p-2 bg-secondary text-quaternary rounded focus:outline-none"
                                        type={isShowNewPasswordConfirmation ? "text" : "password"}
                                        placeholder="Konfirmasi password baru"
                                        id="newPasswordConfirmation"
                                        value={newPasswordConfirmation}
                                        onChange={(e: any) => setNewPasswordConfirmation(e.target.value)}
                                    />
                                    <div role="button" className="text-quaternary border-l border-teriary w-8 flex justify-center" onClick={() => setIsShowNewPasswordConfirmation(!isShowNewPasswordConfirmation)}>
                                        {!isShowNewPasswordConfirmation ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEyeSlash} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
                <div className="flex-1 p-3 text-2xl text-center lg:text-start">
                    <h2 className="font-bold">Data Anda</h2>

                    {/* input item */}
                    <div className="flex flex-col mb-3 text-base items-center lg:items-start">
                        <label htmlFor="name">Nama :</label>
                        <input
                            ref={nameRef}
                            type="text"
                            id="name"
                            name="name"
                            className={`${editable ? 'bg-secondary' : 'bg-quaternary'} p-1 outline-none text-center lg:text-start rounded ${editable && 'w-full'}`}
                            size={name.length}
                            required
                            value={name}
                            onChange={(e: any) => setName(e.target.value)}
                            readOnly={editable ? false : true}
                        />
                    </div>

                    {/* input item */}
                    <div className="flex flex-col mb-3 text-base items-center lg:items-start">
                        <label htmlFor="email">Email :</label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            className={`${editable ? 'bg-secondary' : 'bg-quaternary'} p-1 outline-none text-center lg:text-start rounded ${editable && 'w-full'}`}
                            size={email.length}
                            required
                            value={email}
                            onChange={(e: any) => setEmail(e.target.value)}
                            readOnly={editable ? false : true}
                        />
                    </div>

                    {!editable ?
                        <button
                            className="bg-quaternary text-primary px-4 py-2 rounded text-base"
                            onClick={() => setEditable(!editable)}
                        >
                            <FontAwesomeIcon icon={faPen} />
                        </button>
                        :
                        <>
                            <button
                                className="bg-quaternary text-primary px-4 py-2 rounded text-base mr-1"
                                onClick={cancelEditHandler}
                                title="Batal"
                            >
                                <FontAwesomeIcon icon={faRotateBack} />
                            </button>
                            <button
                                className="bg-quaternary text-primary px-4 py-2 rounded text-base"
                                onClick={updateHandler}
                                title="Simpan"
                            >
                                <FontAwesomeIcon icon={faSave} />
                            </button>
                        </>
                    }

                    {/* input item */}
                    <div className="flex flex-col mb-3 mt-2 text-base items-center lg:items-start">
                        <label htmlFor="signature">TTD :</label>
                        {editableSign && <p className="text-red-600 animate-pulse">Note: Penuhkan batas atas dan bawah kotak</p>}
                        <div className="preview-signature">
                            <>
                                {
                                    !editableSign &&
                                    <Image
                                        src={signature}
                                        width={300}
                                        height={300}
                                        alt={`TTD ${name}`}
                                        className="bg-white w-auto"
                                    />
                                }

                            </>
                        </div>
                        {(editableSign) ?
                            <>
                                <ReactSignatureCanvas
                                    canvasProps={{ className: 'bg-primary mt-1 w-56 h-40' }}
                                    ref={signatureSelectRef}
                                />
                                <div className="flex">
                                    <button className="mt-2 bg-quaternary rounded px-2 py-1 my-2" type="button" onClick={updateHandler}>
                                        Simpan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditableSign(!editableSign)}
                                        className="bg-quaternary rounded px-2 py-1 my-2 mx-1"
                                    >
                                        Batal TTD
                                    </button>
                                    <button className="mt-2 w-fit hover:underline text-red-600" type="button" onClick={() => signatureSelectRef.current.clear()}>
                                        Bersihkan
                                    </button>
                                </div>
                            </>
                            :
                            <button
                                type="button"
                                onClick={() => setEditableSign(!editableSign)}
                                className="bg-quaternary rounded px-2 py-1 my-2"
                            >
                                Edit TTD
                            </button>
                        }
                    </div>


                </div>
            </div>
        </section>
    )
}