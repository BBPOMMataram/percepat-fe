"use client";

import { showAlert } from "@/features/alertSlice";
import { getUser } from "@/features/authSlice";
import { AppDispatch } from "@/redux/store";
import { User } from "@/types/auth";
import api from "@/utils/api";
import dayjs from "@/utils/dayjs";
import { getAuthStorageUrl, getUserPhotoUrl } from "@/utils/userPhoto";
import { CheckCircle2, ExternalLink, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import SignatureCanvas from "react-signature-canvas";

export default function Profile({ user, updateCallName, callName }: { user: User | null, updateCallName: (name: string) => void, callName: string }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [gelarDepan, setGelarDepan] = useState("");
    const [gelarBelakang, setGelarBelakang] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [listFungsi, setListFungsi] = useState([]);
    const [fungsiId, setFungsiId] = useState(user?.employee?.fungsi_id ?? "");
    const [groupJabatan, setGroupJabatan] = useState("");

    // Telegram Notification State
    const [tgConfigured, setTgConfigured] = useState<boolean>(true);
    const [tgBotUsername, setTgBotUsername] = useState<string | null>(null);
    const [tgConnected, setTgConnected] = useState<boolean>(Boolean(user?.telegram_chat_id));
    const [tgEnabled, setTgEnabled] = useState<boolean>(Boolean(user?.telegram_notif_enabled));
    const [tgUsername, setTgUsername] = useState<string | null>(user?.telegram_username ?? null);
    const [tgDeepLink, setTgDeepLink] = useState<string | null>(null);
    const [tgLoading, setTgLoading] = useState<boolean>(false);
    const [tgPolling, setTgPolling] = useState<boolean>(false);

    const fullNameRef = useRef<HTMLInputElement>(null);
    const formProfileRef = useRef<HTMLFormElement>(null);
    const signatureSelectRef = useRef<any>(null)

    const dispatch = useDispatch<AppDispatch>()

    const authBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL_AUTH;

    const loadTelegramStatus = useCallback(async () => {
        if (!authBaseUrl) return;
        try {
            const res = await api.get(`${authBaseUrl}/api/telegram/status`);
            setTgConfigured(Boolean(res.data?.configured));
            setTgBotUsername(res.data?.bot_username ?? null);
            setTgConnected(Boolean(res.data?.connected));
            setTgEnabled(Boolean(res.data?.enabled));
            setTgUsername(res.data?.telegram_username ?? null);
        } catch (err) {
            console.warn("Gagal memuat status Telegram:", err);
        }
    }, [authBaseUrl]);

    useEffect(() => {
        loadTelegramStatus();
    }, [loadTelegramStatus]);

    const checkTelegramConnection = useCallback(async (silent = false) => {
        if (!authBaseUrl) return false;
        if (!silent) setTgLoading(true);
        try {
            const res = await api.post(`${authBaseUrl}/api/telegram/check-connection`);
            const isNowConnected = Boolean(res.data?.connected);
            setTgConnected(isNowConnected);
            setTgEnabled(Boolean(res.data?.enabled));
            setTgUsername(res.data?.telegram_username ?? null);

            if (isNowConnected) {
                setTgPolling(false);
                setTgDeepLink(null);
                await dispatch(getUser());
                dispatch(showAlert({
                    type: "success",
                    message: "Telegram Terhubung",
                    description: "Notifikasi Telegram berhasil diaktifkan pada akun Anda.",
                }));
                return true;
            } else if (!silent) {
                dispatch(showAlert({
                    type: "error",
                    message: "Belum Terhubung",
                    description: "Silakan buka bot Telegram lalu tekan tombol Start terlebih dahulu.",
                }));
            }
        } catch (err: any) {
            if (!silent) {
                const msg = err?.response?.data?.message || "Gagal memeriksa koneksi Telegram.";
                dispatch(showAlert({ type: "error", message: msg, description: msg }));
            }
        } finally {
            if (!silent) setTgLoading(false);
        }
        return false;
    }, [authBaseUrl, dispatch]);

    useEffect(() => {
        if (!tgPolling) return;
        let attempts = 0;
        const maxAttempts = 40; // ~2 menit
        const interval = setInterval(async () => {
            attempts += 1;
            const connected = await checkTelegramConnection(true);
            if (connected || attempts >= maxAttempts) {
                setTgPolling(false);
                clearInterval(interval);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [tgPolling, checkTelegramConnection]);

    const handleActivateTelegram = async () => {
        if (!authBaseUrl) return;
        setTgLoading(true);
        try {
            const res = await api.post(`${authBaseUrl}/api/telegram/link-token`);
            const link = res.data?.deep_link;
            if (link) {
                setTgDeepLink(link);
                setTgPolling(true);
                window.open(link, "_blank", "noopener,noreferrer");
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Gagal membuat link aktivasi Telegram.";
            dispatch(showAlert({ type: "error", message: msg, description: msg }));
        } finally {
            setTgLoading(false);
        }
    };

    const handleTestTelegram = async () => {
        if (!authBaseUrl) return;
        setTgLoading(true);
        try {
            const res = await api.post(`${authBaseUrl}/api/telegram/test`);
            dispatch(showAlert({
                type: "success",
                message: "Tes Terkirim",
                description: res.data?.message || "Pesan tes berhasil dikirim ke Telegram Anda.",
            }));
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Gagal mengirim pesan tes Telegram.";
            dispatch(showAlert({ type: "error", message: msg, description: msg }));
        } finally {
            setTgLoading(false);
        }
    };

    const getFungsi = () => {
        api.get(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/fungsis`)
            .then(res => {
                setListFungsi(res.data);
            })
            .catch(err => {
                console.log(err);
            });
    }

    useEffect(() => {
        getFungsi();
    }, [])

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setGelarDepan(user.employee?.gelar_depan ?? "");
            setGelarBelakang(user.employee?.gelar_belakang ?? "");
            setFungsiId(user.employee?.fungsi_id ?? "");

            if (user.employee?.group_jabatan?.id === 1) {
                setGroupJabatan("Kepala Balai")
            } else if (user.employee?.group_jabatan?.id === 2) {
                setGroupJabatan("Kepala Tata Usaha")
            }
            else if (user.employee?.group_jabatan?.id === 3) {
                setGroupJabatan("Ketua Tim")
                if (user.employee?.is_ppk) {
                    setGroupJabatan("Ketua Tim - PPK")
                }

                if (user.employee?.is_katim_pengujian) {
                    setGroupJabatan("Ketua Tim Pengujian")
                    if (user.employee?.is_ppk) {
                        setGroupJabatan("Ketua Tim Pengujian - PPK")
                    }
                }
            } else if (user.employee?.group_jabatan?.id === 4) {
                setGroupJabatan("Staf")
                if (user.employee?.is_ppk) {
                    setGroupJabatan("PPK")
                }
            } else if (user.employee?.group_jabatan?.id === 5) {
                setGroupJabatan("Staf OS")
            }
        }
    }, [user]);

    useEffect(() => {
        if (fullNameRef.current) {
            fullNameRef.current.focus();
        }
    }, [isEditing]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formProfileRef.current) {
            const formData = new FormData(formProfileRef.current);
            formData.append('_method', 'PATCH');

            if (signatureSelectRef.current && !signatureSelectRef.current.isEmpty()) {
                formData.append('signature_path', signatureSelectRef.current.toDataURL());
            }

            try {
                const res = await api.post(`${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/update-profile`, formData);
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }));
                await dispatch(getUser());
                setIsEditing(false);
            } catch (err: any) {
                const message = err?.response?.data?.message || "No Message from Backend";
                dispatch(showAlert({ type: "error", message, description: message }));
            }
        }
    };

    return (
        <div className="flex flex-col">
            <form ref={formProfileRef} onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow p-8">
                    <div className="flex flex-wrap gap-4 mb-8">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getUserPhotoUrl(user?.photo_path)}
                                    alt="Profile photo"
                                    width={64}
                                    height={64}
                                    className="w-16 h-16 rounded-full object-cover"
                                    onError={(event) => {
                                        event.currentTarget.src = "/assets/images/noimage.webp";
                                    }}
                                />
                                <div>
                                    <h3 className=" md:text-lg font-semibold text-gray-800">{`${gelarDepan ? gelarDepan + ". " : ""}${name}${gelarBelakang ? ", " + gelarBelakang : ""}`}</h3>
                                    <p className="text-xs md:text-sm text-gray-500">{groupJabatan}</p>
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
                                    onChange={(e) => setGelarDepan(e.target.value)}
                                    readOnly={!isEditing}
                                    name="employee[gelar_depan]"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Gelar Belakang</label>
                                <input type="text" placeholder="Gelar Belakang" className="ar-input-text-green w-full"
                                    defaultValue={user.employee.gelar_belakang || ""}
                                    onChange={(e) => setGelarBelakang(e.target.value)}
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
                            <div>
                                <label className="text-sm text-gray-500">Fungsi</label>
                                <select
                                    className="ar-input-text-green w-full"
                                    disabled={!isEditing}
                                    name="employee[fungsi_id]"
                                    value={fungsiId}
                                    onChange={(e) => setFungsiId(e.target.value)}
                                >
                                    <option value="">Pilih Fungsi</option>

                                    {listFungsi?.map((fungsi: any) => (
                                        <option key={fungsi.id} value={String(fungsi.id)}>
                                            {fungsi.name}
                                        </option>
                                    ))}
                                </select>
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
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getAuthStorageUrl(user?.signature_path)}
                                    alt="Signature Image"
                                    width={64}
                                    height={64}
                                    className="w-30 h-30 object-contain"
                                    onError={(event) => {
                                        event.currentTarget.src = "/assets/images/noimage.svg";
                                    }}
                                />
                            </>
                        }
                    </div>
                </div>
            </form>

            {/* NOTIFIKASI TELEGRAM SECTION */}
            <div className="bg-white rounded-2xl shadow px-8 py-6 mt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <Send className="h-5 w-5 text-[#0088cc]" />
                            <h3 className="text-base font-bold text-gray-800">Notifikasi Telegram</h3>
                            {tgConnected ? (
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        tgEnabled
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-amber-50 text-amber-700"
                                    }`}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {tgEnabled ? "Aktif" : "Terhubung (Nonaktif)"}
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                                    Belum Terhubung
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            {tgConnected
                                ? `Terhubung dengan akun Telegram${tgUsername ? ` @${tgUsername}` : ""}. Notifikasi modul akan dikirim langsung ke bot Telegram.`
                                : `Hubungkan akun Anda dengan bot Telegram${tgBotUsername ? ` (@${tgBotUsername})` : ""} untuk menerima notifikasi langsung di Telegram.`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {!tgConnected ? (
                            <button
                                type="button"
                                onClick={handleActivateTelegram}
                                disabled={tgLoading || !tgConfigured}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#0088cc] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0077b5] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Send className="h-4 w-4" />
                                {tgLoading ? "Menyiapkan..." : "Aktifkan Notifikasi Telegram"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleTestTelegram}
                                disabled={tgLoading || !tgEnabled}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Send className="h-3.5 w-3.5" />
                                Tes Notif
                            </button>
                        )}
                    </div>
                </div>

                {!tgConfigured && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Bot Telegram belum dikonfigurasi pada server (<code>TELEGRAM_BOT_TOKEN</code> belum diisi di <code>.env</code> Auth-BPOM).
                    </p>
                )}

                {!tgConnected && tgDeepLink && (
                    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900">
                        <p className="font-semibold">Menunggu konfirmasi dari Telegram...</p>
                        <p className="mt-1 text-sky-800">
                            1. Buka bot Telegram melalui tombol di bawah lalu tekan <strong>Start</strong>.<br />
                            2. Status di halaman ini akan otomatis berubah menjadi terhubung setelah Anda menekan Start.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <a
                                href={tgDeepLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0088cc] px-3 py-1.5 font-semibold text-white hover:bg-[#0077b5]"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Buka Bot Telegram
                            </a>
                            <button
                                type="button"
                                onClick={() => checkTelegramConnection(false)}
                                disabled={tgLoading}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300 bg-white px-3 py-1.5 font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${tgPolling || tgLoading ? "animate-spin" : ""}`} />
                                Cek Status Koneksi
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTgDeepLink(null);
                                    setTgPolling(false);
                                }}
                                className="inline-flex items-center rounded-lg px-2.5 py-1.5 font-semibold text-slate-500 hover:bg-slate-100"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow px-8 py-4 mt-6 text-xs">
                <div>
                    <p className="text-gray-400">Join since {user?.created_at ? dayjs(user.created_at).format("DD MMMM YYYY") : "-"}</p>
                    <p className="text-gray-400 mt-1">
                        <span className="capitalize">{user?.employee && `${user?.employee.group_jabatan?.name} ${user?.employee.fungsi?.name} ${user?.employee.unit_kerja}`}</span>
                        <span>{user?.student && `Mahasiswa PKL ${user?.student.university}`}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
