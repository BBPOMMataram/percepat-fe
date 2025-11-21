import { showAlert } from "@/features/alertSlice";
import { AppDispatch, RootState } from "@/redux/store";
import api from "@/utils/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

interface ModalDisposisiPemeliharaanProps {
    show: boolean;
    onClose: () => void;
    code: string;
    updateDataDisposisi: () => void;
}

export default function ModalDisposisiPemeliharaan({
    show,
    onClose,
    code,
    updateDataDisposisi
}: ModalDisposisiPemeliharaanProps) {
    const dispatch = useDispatch<AppDispatch>();

    const [detailData, setDetailData] = useState<any>(null);
    const [note, setNote] = useState<string>("");
    const [kabalai, setKabalai] = useState<any>(null);
    const [listPetugasBmn, setListPetugasBmn] = useState<any[]>([]);
    const [petugasBmnSelected, setPetugasBmnSelected] = useState<any>(null);
    const [listPpk, setListPpk] = useState<any[]>([]);
    const [ppkSelected, setPpkSelected] = useState<any>(null);
    const [listPp, setListPp] = useState<any[]>([]);
    const [ppSelected, setPpSelected] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isButuhPengadaan, setIsButuhPengadaan] = useState<boolean>(false);
    const [listPengadaan, setListPengadaan] = useState<any[]>([]);
    const [itemPengadaan, setItemPengadaan] = useState<any>(null);
    const [isDone, setIsDone] = useState<boolean>(false); // tanda untuk menandakan pemeliharaan sudah selesai oleh petugas bmn

    const { user } = useSelector((state: RootState) => state.auth);

    const inputPengadaanRef = useRef<any>(null);

    const getDetailPemeliharaan = useCallback(() => {
        if (!code) return; // hindari fetch kalau code kosong/null

        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-detail`,
            { code }
        ).then((res) => {
            setDetailData(res?.data);
            console.log(res?.data);

        }).catch((err) => {
            console.log(err);
        });
    }, [code]);

    const getKaBalai = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-kabalai`
        ).then((res) => {
            setKabalai(res.data?.user); // karena "data" disini adalah employee
        }).catch((err) => {
            console.log(err);
        })
    }

    const getPetugasBmn = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-petugas-bmn`
        ).then((res) => {
            setListPetugasBmn(res.data); // karena "data" disini adalah employee
        }).catch((err) => {
            console.log(err);
        })
    }

    const getPpk = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-ppk`
        ).then((res) => {
            setListPpk(res.data); // karena "data" disini adalah employee
        }).catch((err) => {
            console.log(err);
        })
    }

    const getPp = () => {
        api(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-pp`
        ).then((res) => {
            setListPp(res.data); // karena "data" disini adalah employee
        }).catch((err) => {
            console.log(err);
        })
    }

    useEffect(() => {
        getKaBalai();
        getPetugasBmn();
        getPpk();
        getPp();
        if (show) getDetailPemeliharaan();
    }, [show, getDetailPemeliharaan]);

    useEffect(() => {
        // ALUR SELANJUTNYA ADALAH TANDAI SELESAI ATAU RB JIKA DISPO SEBELUMNYA IN PROGRESS & JIKA BUTUH PENGADAAN MAKA LANJUT KE PPK SETISDONE NYA FALSE
        if (detailData?.disposisi_new_pemeliharaan.at(-1).status === 'in_progress') {
            setIsDone(true);
        }
    }, [detailData])

    const submitDisposisi = (isRejected = false, isMarkedDone: false | 'done' | 'rb' = false) => {
        if (!note) {
            alert("Silahkan isi catatan terlebih dahulu.");
            return;
        }

        const isKaTu = user?.employee?.group_jabatan?.id === 2
        const isKatimPengujian = user?.employee?.is_katim_pengujian
        const isKaBalai = user?.employee?.group_jabatan?.id === 1
        const isPetugasBmn = user?.employee?.petugas_bmn

        let toUser = null;
        let lastStatusDisposisi = null; // status disposisi sebelum nya
        let inProgress = false;

        // DISPO KATIM PENGUJIAN / KATU
        if (isKaTu || isKatimPengujian) {
            lastStatusDisposisi = isRejected ? 'rejected' : 'forwarded'; // status disposisi sebelum nya diupdate dengan ini sebelum buat disposisi baru
            toUser = kabalai; // kalau di reject nanti toUser nya dibalikin ke pelapor di backend, bukan pake ini
            // DISPO KABALAI
        } else if (isKaBalai) {
            lastStatusDisposisi = isRejected ? 'rejected' : 'forwarded';
            toUser = petugasBmnSelected;

            if (!isRejected && !petugasBmnSelected) {
                alert("Silahkan pilih petugas BMN terlebih dahulu.");
                return;
            }
            // DISPO PETUGAS 
        } else if (isPetugasBmn) {
            lastStatusDisposisi = 'forwarded'; // status disposisi sebelumnya hanya forwarded karena tidak bisa menolak kecuali di katu / katim / kabalai / ppk / pp
            inProgress = true; // TANDAI IN PROGRESS
            toUser = user; // JIKA PETUGAS TINDAK LANJUT IN PROGRESS MAKA DISPOSISI NYA KE DIRINYA SENDIRI UNTUK NANTI DI TANDAI SELESAI ATAU RB OLEH DIRINYA SENDIRI

            // JIKA MARKED SELESAI DONE / RB
            if (isMarkedDone) {
                inProgress = false;
            }

            if (isButuhPengadaan) {

                if (!ppkSelected) {
                    alert("Silahkan pilih PPK terlebih dahulu.");
                    return;
                }
                toUser = ppkSelected;
            }

        }

        if (!window.confirm(`Apakah Anda yakin ingin ${isRejected ? 'menolak' : 'melanjutkan'} disposisi ini?`)) {
            return;
        }

        setIsSubmitting(true);
        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/next-disposition`,
            {
                code,
                fromUser: user,
                toUser,
                note,
                lastStatusDisposisi,
                petugasBmnSelected: isKaBalai ? petugasBmnSelected : null, // jika petugasBmnSelected tidak null berarti didisposisi oleh kabalai dan petugas ini dipake untuk update data new pemeliharaan sebagai petugas di backend
                inProgress,
                isMarkedDone, // MAU DONE MAUPUN RB JIKA BUKAN FALSE ARTINYA SELESAI DIKERJAKAN
            })
            .then((res) => {
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }));
                console.log(res.data);
                closeModal();
                setIsSubmitting(false);
                updateDataDisposisi(); // update table
            })
            .catch((err) => {
                dispatch(showAlert({ type: "error", message: err?.response?.data?.message, description: err.response?.data?.message || "No Message from Backend" }));
                console.log(err);
                setIsSubmitting(false);
            })
    }

    const closeModal = () => {
        onClose();
        setNote("");
        setPetugasBmnSelected(null);
        setPpkSelected(null);
        setPpSelected(null);
        setIsDone(false);
    }

    if (!show) return null;
    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            onClick={closeModal}
        >
            <div
                className="bg-white rounded-lg p-6 w-full max-w-6xl space-y-4 mx-4 overflow-auto max-h-[calc(100vh-50px)]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-semibold font-serif">Disposisi</h2>
                <textarea className="ar-input-text-purple w-full h-20"
                    placeholder={`Catatan`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}></textarea>

                {
                    user?.employee?.group_jabatan?.id === 1 &&
                    <div className="mt-4 flex flex-col gap-2">
                        <label className="ar-label-required">Petugas BMN</label>
                        <select className="ar-input-text-purple w-fit"
                            value={petugasBmnSelected?.id || ""}
                            onChange={(e) => {
                                const selectedUser = listPetugasBmn.find(
                                    (item) => item.user.id === e.target.value
                                )?.user;
                                setPetugasBmnSelected(selectedUser);
                            }}
                        >
                            <option value="">-- Pilih Petugas BMN --</option>
                            {listPetugasBmn?.length > 0 ? (
                                listPetugasBmn?.map(item => <option key={item.user?.id} value={item.user?.id}>{item.user?.call_name || item.user?.name} ( {item.petugas_bmn?.name} )</option>)
                            ) : (
                                <option value="">Tidak ada data petugas</option>
                            )}
                        </select>
                    </div>
                }

                {
                    // TAMPILKAN JIKA PETUGAS BMN DAN SAAT SUDAH DI PROSES / DISPO TERAKHIR NYA IN PROGRESS
                    (user?.employee?.petugas_bmn && detailData?.disposisi_new_pemeliharaan.at(-1).status === 'in_progress') &&
                    <>
                        <div className="mt-4 flex flex-col gap-2">
                            <div>
                                <div className="flex items-center">
                                    <input type="checkbox" className="mr-2" checked={isButuhPengadaan} onChange={(e) => {
                                        setIsButuhPengadaan(e.target.checked);

                                        // JIKA BUTUH PENGADAAN ARTINYA BELUM SELESAI MAKA LANJUTKAN KE PPK
                                        if (e.target.checked) {
                                            setIsDone(false);
                                        } else {
                                            setIsDone(true);
                                        }
                                    }} />
                                    <label className="text-sm font-medium">Butuh Pengadaan</label>
                                </div>
                            </div>
                        </div>
                        {
                            isButuhPengadaan &&
                            <>
                                <div className="mt-4 flex flex-col gap-2">
                                    <label className="ar-label-required">PPK</label>
                                    <select className="ar-input-text-purple w-fit"
                                        value={ppkSelected?.id || ""}
                                        onChange={(e) => {
                                            const selectedUser = listPpk.find(
                                                (item) => item.user.id === e.target.value
                                            )?.user;
                                            setPpkSelected(selectedUser);
                                        }}
                                    >
                                        <option value="">-- Pilih PPK --</option>
                                        {listPpk?.length > 0 ? (
                                            listPpk?.map(item => <option key={item.user?.id} value={item.user?.id}>{item.user?.call_name || item.user?.name}</option>)
                                        ) : (
                                            <option value="">Tidak ada data PPK</option>
                                        )}
                                    </select>
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <div className="mt-4 flex flex-col gap-2">
                                        <label className="ar-label-required">Tambahkan Pengadaan</label>
                                        <div className="flex gap-2">
                                            <input type="text" className="ar-input-text-purple w-fit"
                                                value={itemPengadaan || ""}
                                                onChange={(e) => setItemPengadaan(e.target.value)}
                                                ref={inputPengadaanRef}
                                            />
                                            <button className="btn btn-primary" onClick={() => {
                                                setListPengadaan(list => [...list, itemPengadaan])
                                                setItemPengadaan("")
                                                inputPengadaanRef.current?.focus()
                                            }}>
                                                Tambah
                                            </button>
                                        </div>
                                    </div>
                                    <ul className="list-decimal list-inside mt-2 flex flex-col">
                                        {
                                            listPengadaan?.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            </>
                        }
                    </>
                }

                {
                    user?.employee?.is_ppk &&
                    <div className="mt-4 flex flex-col gap-2">
                        <label className="ar-label-required">PP</label>
                        <select className="ar-input-text-purple w-fit"
                            value={ppSelected?.id || ""}
                            onChange={(e) => {
                                const selectedUser = listPp.find(
                                    (item) => item.user.id === e.target.value
                                )?.user;
                                setPpSelected(selectedUser);
                            }}
                        >
                            <option value="">-- Pilih PP --</option>
                            {listPp?.length > 0 ? (
                                listPp?.map(item => <option key={item.user?.id} value={item.user?.id}>{item.user?.call_name || item.user?.name}</option>)
                            ) : (
                                <option value="">Tidak ada data PPK</option>
                            )}
                        </select>
                    </div>
                }

                <div className="flex ml-auto w-fit gap-4">

                    {
                        (user?.employee?.petugas_bmn && isDone) ?
                            <>
                                <button
                                    type="button"
                                    onClick={() => submitDisposisi(false, 'done')}
                                    className={`btn btn-primary mt-6 ${isSubmitting && 'loading'}`}
                                    disabled={isSubmitting}
                                >
                                    Tandai Selesai
                                </button>
                                <button
                                    type="button"
                                    onClick={() => submitDisposisi(false, 'rb')}
                                    className={`btn btn-error mt-6 ${isSubmitting && 'loading'}`}
                                    disabled={isSubmitting}
                                >
                                    Tandai Rusak Berat
                                </button>
                            </> :
                            <button
                                type="button"
                                onClick={() => submitDisposisi(false)}
                                className={`btn btn-primary mt-6 ${isSubmitting && 'loading'}`}
                                disabled={isSubmitting}
                            >
                                Tindak Lanjut
                            </button>
                    }

                    {
                        //ga usah tampilkan tolak untuk petugas bmn atau pelapor
                        (!user?.employee?.petugas_bmn && !user?.id === detailData?.pelapor?.external_user_id)
                        &&
                        <button
                            type="button"
                            onClick={() => submitDisposisi(true)}
                            className={`btn btn-error mt-6 ${isSubmitting && 'loading'}`}
                            disabled={isSubmitting}
                        >
                            Tolak
                        </button>
                    }
                    <button
                        type="button"
                        onClick={closeModal}
                        className="btn mt-6"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    )
}