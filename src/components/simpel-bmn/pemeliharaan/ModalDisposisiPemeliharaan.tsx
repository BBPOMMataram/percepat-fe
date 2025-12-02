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

type DispositionStatus = 'pending' | 'forwarded' | 'in_progress' | 'done' | 'rb' | 'rejected' | null

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
    const [itemPengadaan, setItemPengadaan] = useState<any>({
        name: "",
        qty: 1,
        satuan: ""
    });
    const [listPengadaan, setListPengadaan] = useState<any[]>([]);
    const [isDone, setIsDone] = useState<boolean>(false); // tanda untuk menandakan pemeliharaan sudah selesai oleh petugas bmn
    const [mergedDetailData, setMergedDetailData] = useState<any>(null);

    const { user } = useSelector((state: RootState) => state.auth);

    const inputPengadaanRef = useRef<any>(null);

    const getDetailPemeliharaan = useCallback(() => {
        if (!code) return; // hindari fetch kalau code kosong/null

        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_SIMPEL_BMN}/api/get-pemeliharaan-detail`,
            { code }
        ).then((res) => {
            setDetailData(res?.data);
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
        // JIKA DISPO SEBELUMNYA IN PROGRESS (OLEH PETUGAS) 
        // MAKA ALUR SELANJUTNYA ADALAH TANDAI SELESAI ATAU RB 
        // NAMUN JIKA BUTUH PENGADAAN MAKA LANJUT KE PPK NANTI SETISDONE NYA FALSE
        if (detailData?.disposisi_new_pemeliharaan.at(-1).status === 'in_progress') {
            setIsDone(true);
        }

        // SETISDONE TRUE JUGA JIKA DISPO SEBELUMNYA DARI PP UNTUK MENGAKTIFKAN BUTTON SELESAI PETUGAS
        if (mergedDetailData?.disposisi_new_pemeliharaan.at(-1).from_user?.auth_user?.employee?.is_pp) {
            setIsDone(true);
        }

    }, [detailData, mergedDetailData])

    useEffect(() => {
        const data = detailData;
        if (!data || typeof data !== "object") return;

        // =====================================
        // 1. Kumpulkan SEMUA external_user_id
        // =====================================
        const ids: string[] = [];

        // petugas
        if (data.petugas?.external_user_id) {
            ids.push(data.petugas.external_user_id);
        }

        // pelapor
        if (data.pelapor?.external_user_id) {
            ids.push(data.pelapor.external_user_id);
        }

        // disposisi from_user & to_user
        data.disposisi_new_pemeliharaan?.forEach((d: any) => {
            if (d.from_user?.external_user_id) ids.push(d.from_user.external_user_id);
            if (d.to_user?.external_user_id) ids.push(d.to_user.external_user_id);
        });

        // unique
        const uniqueIds = [...new Set(ids)];

        if (uniqueIds.length === 0) {
            setMergedDetailData(detailData);
            return;
        }

        // =====================================
        // 2. Fetch batch user dari AUTH server
        // =====================================
        api.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_AUTH}/api/get-user-batch`,
            { ids: uniqueIds }
        )
            .then(res => {
                const authUsers = res.data || [];

                // authMap[id] = user_object
                const authMap: Record<string, any> = {};
                authUsers.forEach((u: any) => {
                    authMap[u.id] = u;
                });

                // =====================================
                // 3. Merge auth_user berdasarkan masing2 ID
                // =====================================
                const merged = {
                    ...data,

                    // petugas
                    petugas: data.petugas
                        ? {
                            ...data.petugas,
                            auth_user: authMap[data.petugas.external_user_id] || null,
                        }
                        : null,

                    // pelapor
                    pelapor: data.pelapor
                        ? {
                            ...data.pelapor,
                            auth_user: authMap[data.pelapor.external_user_id] || null,
                        }
                        : null,

                    // disposisi
                    disposisi_new_pemeliharaan:
                        data.disposisi_new_pemeliharaan?.map((d: any) => ({
                            ...d,
                            from_user: d.from_user
                                ? {
                                    ...d.from_user,
                                    auth_user:
                                        authMap[d.from_user.external_user_id] || null,
                                }
                                : null,
                            to_user: d.to_user
                                ? {
                                    ...d.to_user,
                                    auth_user:
                                        authMap[d.to_user.external_user_id] || null,
                                }
                                : null,
                        })) || [],
                };

                setMergedDetailData(merged);
            })
            .catch(err => {
                console.log(err);
                setMergedDetailData(detailData);
            });
    }, [detailData]);

    const submitDisposisi = (isRejected: boolean = false, isMarkedDone: false | 'done' | 'rb' = false) => {
        if (!note) {
            alert("Silahkan isi catatan terlebih dahulu.");
            return;
        }

        const isKaTu = user?.employee?.group_jabatan?.id === 2
        const isKatimPengujian = user?.employee?.is_katim_pengujian
        const isKaBalai = user?.employee?.group_jabatan?.id === 1
        const isPetugasBmn = user?.employee?.petugas_bmn
        const isPpk = user?.employee?.is_ppk
        const isPp = user?.employee?.is_pp

        let toUser = null;
        let lastStatusDisposisi: DispositionStatus = null; // status disposisi sebelum nya
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

            // JIKA MARKED SELESAI (DONE / RB)
            if (isMarkedDone) {
                inProgress = false;
                // toUser nya dibuat null di backend
            }

            // JIKA BUTUH PENGADAAN MAKA LANJUT KE PPK
            if (isButuhPengadaan) {
                inProgress = false
                if (!ppkSelected) {
                    alert("Silahkan pilih PPK terlebih dahulu.");
                    return;
                }
                toUser = ppkSelected; // TANDAI DARI PETUGAS KE PPK

                if (listPengadaan.length === 0) {
                    alert("Silahkan tambahkan barang pengadaan terlebih dahulu.");
                    return;
                }
            }
            // DISPO PPK
        } else if (isPpk) {
            lastStatusDisposisi = 'forwarded'; // status disposisi sebelumnya hanya forwarded karena tidak bisa menolak kecuali di katu / katim / kabalai / ppk / pp
            toUser = ppSelected; // TANDAI DARI PPK KE PP
            if (!ppSelected) {
                alert("Silahkan pilih PP terlebih dahulu.");
                return;
            }
        } else if (isPp) {
            lastStatusDisposisi = 'forwarded'; // status disposisi sebelumnya hanya forwarded karena tidak bisa menolak kecuali di katu / katim / kabalai / ppk / pp
            toUser = mergedDetailData?.petugas?.auth_user;
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
                listPengadaan, // JIKA TIDAK NULL BERARTI INI DARI PETUGAS KE PPK
            })
            .then((res) => {
                dispatch(showAlert({ type: "success", message: res.data.message, description: res.data.message }));
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
                <h2 className="text-xl font-semibold font-serif ar-label-required">Disposisi</h2>
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
                                                value={itemPengadaan.name || ""}
                                                onChange={(e) => setItemPengadaan((prevItemPengadaan: any) => ({ ...prevItemPengadaan, name: e.target.value }))}
                                                ref={inputPengadaanRef}
                                                placeholder="Nama"
                                            />
                                            <input type="number" className="ar-input-text-purple w-fit"
                                                value={itemPengadaan.qty}
                                                onChange={(e) => setItemPengadaan((prevItemPengadaan: any) => ({ ...prevItemPengadaan, qty: e.target.value }))}
                                                placeholder="qty"
                                                min={1}
                                            />
                                            <input type="text" className="ar-input-text-purple w-fit"
                                                value={itemPengadaan.satuan}
                                                onChange={(e) => setItemPengadaan((prevItemPengadaan: any) => ({ ...prevItemPengadaan, satuan: e.target.value }))}
                                                placeholder="satuan"
                                            />
                                            <button className="btn btn-primary"
                                                onClick={() => {
                                                    if (!itemPengadaan.name || !itemPengadaan.qty || !itemPengadaan.satuan) return
                                                    setListPengadaan(list => [...list, {
                                                        ...itemPengadaan,
                                                        qty: parseInt(itemPengadaan.qty)
                                                    }])
                                                    setItemPengadaan({ name: "", qty: 1, satuan: "" })  // reset benar
                                                    inputPengadaanRef.current?.focus()
                                                }}>
                                                Tambah
                                            </button>
                                        </div>
                                    </div>
                                    <ul className="list-decimal list-inside mt-2 flex flex-col">
                                        {
                                            listPengadaan?.map((item, index) => (
                                                <li key={index}>{`${item.name} (${item.qty} ${item.satuan})`}</li>
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
                            </>
                            :
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
                        (!user?.employee?.petugas_bmn && user?.id !== detailData?.pelapor?.external_user_id)
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