/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Script from "next/script";
import api from "@/utils/api";
import { toast } from "react-toastify";
import PopupSurvey from "./PopupSurvey";
import NavbarETamu from "./layout/NavbarETamu";
import {
    KnownGuestFace,
} from "@/utils/faceRecognition";

const BPOM_LAT = -8.5877864;
const BPOM_LNG = 116.1157653;

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

export default function ETamuGuestBook() {
    const [services, setServices] = useState<any[]>([]);
    const [guestNames, setGuestNames] = useState<string[]>([]);
    const [totalGuests, setTotalGuests] = useState(0);
    const [distance, setDistance] = useState(0);
    const [userCoords, setUserCoords] = useState<{lat: number, lng: number, acc: number} | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [locationStatus, setLocationStatus] = useState<'checking' | 'allowed' | 'denied' | 'too_far'>('checking');
    const [showEvacuationPopup, setShowEvacuationPopup] = useState(true);

    const [formData, setFormData] = useState({
        nama: '', hp: '', email: '', instansi: '', alamat: '', layanan: '', layananCustom: ''
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const activeDeviceIdRef = useRef<string>("");
    const isDetectingRef = useRef(false);
    const [isCameraLoading, setIsCameraLoading] = useState(true);
    const [isSnapping, setIsSnapping] = useState(false);
    
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [manualFaceDescriptor, setManualFaceDescriptor] = useState<number[] | null>(null);

    // ==========================================
    // STATE FACE RECOGNITION (SMART GUESTBOOK)
    // ==========================================
    const [knownFaces, setKnownFaces] = useState<KnownGuestFace[]>([]);
    const [isFaceScanEnabled, setIsFaceScanEnabled] = useState(true);
    const [isModelsReady, setIsModelsReady] = useState(false);
    const [faceDetectionStatus, setFaceDetectionStatus] = useState<'idle' | 'scanning' | 'detected' | 'recognized'>('idle');
    const [recognizedGuest, setRecognizedGuest] = useState<KnownGuestFace | null>(null);
    const [recognizedPhoto, setRecognizedPhoto] = useState<string | null>(null);
    const [recognitionConfidence, setRecognitionConfidence] = useState(0);
    const [showRecognizedModal, setShowRecognizedModal] = useState(false);
    const [recognizedService, setRecognizedService] = useState("");
    const [recognizedServiceCustom, setRecognizedServiceCustom] = useState("");

    const [showSurvey, setShowSurvey] = useState(false);
    const [guestIdSaved, setGuestIdSaved] = useState<number | null>(null);
    const [guestNameSaved, setGuestNameSaved] = useState("");

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ETAMU || 'http://localhost:8002';

    // Logika Rekursif Pengecekan Akurasi Lokasi (Dioptimalkan: kalkulasi jarak instan & cache sesi)
    const checkLocation = useCallback((retryCount = 0) => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('etamu_location_allowed') === 'true') {
            setLocationStatus('allowed');
            return;
        }

        setLocationStatus('checking');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude, accuracy } = pos.coords;
                    const dist = getDistanceInMeters(BPOM_LAT, BPOM_LNG, latitude, longitude);
                    setDistance(dist);
                    setUserCoords({ lat: latitude, lng: longitude, acc: accuracy });

                    const isLocal = typeof window !== 'undefined' && (
                        window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1'
                    );

                    // Jika berada dalam radius 50m atau localhost/dev, langsung izinkan instan tanpa menunggu retry
                    if (dist <= 50 || isLocal) {
                        setLocationStatus('allowed');
                        if (typeof window !== 'undefined') {
                            sessionStorage.setItem('etamu_location_allowed', 'true');
                        }
                        return;
                    }

                    if (accuracy > 100 && retryCount < 2) {
                        setTimeout(() => checkLocation(retryCount + 1), 1000);
                        return;
                    }

                    if (dist <= 1000) {
                        setLocationStatus('allowed');
                        if (typeof window !== 'undefined') {
                            sessionStorage.setItem('etamu_location_allowed', 'true');
                        }
                    } else {
                        setLocationStatus('too_far');
                    }
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                        setLocationStatus('allowed');
                        return;
                    }
                    setLocationStatus('denied');
                },
                { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
            );
        } else {
            setLocationStatus('denied');
        }
    }, []);

    useEffect(() => {
        checkLocation();
    }, [checkLocation]);

    // Inisialisasi Data Tamu, Layanan & Bobot Model Face Recognition
    useEffect(() => {
        api.get(`${baseURL}/api/e-tamu/init`).then(res => {
            setServices(res.data.services || []);
            setGuestNames(res.data.guests || []);
            setTotalGuests(res.data.guests_this_year || 0);
        }).catch(err => console.error(err));

        // Ambil daftar tamu yang memiliki face descriptor dari database
        api.get(`${baseURL}/api/e-tamu/faces`).then(res => {
            const list = res.data?.faces || [];
            const parsed: KnownGuestFace[] = list.map((item: any) => {
                let desc = item.face_descriptor;
                if (typeof desc === 'string') {
                    try { desc = JSON.parse(desc); } catch (e) { desc = null; }
                }
                return {
                    id: item.id,
                    name: item.name,
                    hp: item.hp,
                    company: item.company,
                    address: item.address,
                    email: item.email,
                    pangkat: item.pangkat,
                    jabatan: item.jabatan,
                    descriptor: desc,
                };
            }).filter((item: any) => Array.isArray(item.descriptor) && item.descriptor.length === 128);

            setKnownFaces(parsed);
        }).catch(err => console.error("Gagal memuat face descriptors:", err));

        // Model AI sekarang dijalankan di Server-Side Next.js (/api/e-tamu/recognize)
        setIsModelsReady(true);

    }, [baseURL]);

    const startCamera = useCallback(async (deviceId?: string) => {
        // Jika kamera dengan deviceId ini sudah aktif berjalan, jangan restart hardware!
        if (
            streamRef.current && 
            streamRef.current.active && 
            activeDeviceIdRef.current === (deviceId || "default")
        ) {
            setIsCameraLoading(false);
            return;
        }

        setIsCameraLoading(true);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        try {
            const constraints: MediaStreamConstraints = {
                video: deviceId 
                    ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 960 } } 
                    : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = mediaStream;
            activeDeviceIdRef.current = deviceId || "default";

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.log("Play error:", e));
                    setIsCameraLoading(false);
                };
            } else {
                setIsCameraLoading(false);
            }

            // Setelah izin kamera didapat, isi daftar kamera tanpa me-restart stream
            if (navigator.mediaDevices?.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices().then(devices => {
                    const videoInputs = devices.filter(d => d.kind === 'videoinput');
                    setCameras(videoInputs);
                    if (videoInputs.length > 0 && !selectedCamera) {
                        const activeTrack = mediaStream.getVideoTracks()[0];
                        const activeId = activeTrack?.getSettings()?.deviceId || videoInputs[0].deviceId;
                        activeDeviceIdRef.current = activeId;
                        setSelectedCamera(activeId);
                    }
                }).catch(err => console.error("Enumerate devices error:", err));
            }
        } catch (error) {
            console.error("Camera access error:", error);
            setIsCameraLoading(false);
            toast.error("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
        }
    }, [selectedCamera]);

    useEffect(() => {
        if (locationStatus === 'allowed' && !imageUri) {
            startCamera(selectedCamera);
        }
        return () => {
            if (imageUri && streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                activeDeviceIdRef.current = "";
            }
        };
    }, [selectedCamera, startCamera, imageUri, locationStatus]);

    // Ambil Snapshot dari feed video (digunakan baik manual snap maupun auto face-recognition)
    const captureSnapshotFromVideo = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return null;

        const vWidth = video.videoWidth || 640;
        const vHeight = video.videoHeight || 480;

        const boxWidth = video.clientWidth || 4;
        const boxHeight = video.clientHeight || 3;
        const targetAspect = boxWidth / boxHeight;
        const videoAspect = vWidth / vHeight;

        let sx = 0;
        let sy = 0;
        let sWidth = vWidth;
        let sHeight = vHeight;

        if (videoAspect > targetAspect) {
            sWidth = vHeight * targetAspect;
            sx = (vWidth - sWidth) / 2;
        } else {
            sHeight = vWidth / targetAspect;
            sy = (vHeight - sHeight) / 2;
        }

        const outputWidth = Math.round(sWidth > 640 ? 640 : sWidth);
        const outputHeight = Math.round(outputWidth / targetAspect);

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (context) {
            context.drawImage(
                video,
                sx, sy, sWidth, sHeight,
                0, 0, outputWidth, outputHeight
            );
            return canvas.toDataURL('image/jpeg', 0.85);
        }
        return null;
    }, []);

    // Helper Server-Side Face Recognition (Next.js Route)
    const recognizeFaceViaServer = async (snapshotDataUrl: string) => {
        try {
            const res = await fetch('/api/e-tamu/recognize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: snapshotDataUrl }),
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (err) {
            console.error("Server face recognition error:", err);
            return null;
        }
    };

    // ========================================================
    // REAL-TIME FACE RECOGNITION SCANNER LOOP (SERVER-SIDE)
    // ========================================================
    useEffect(() => {
        if (
            locationStatus !== 'allowed' ||
            imageUri ||
            showRecognizedModal ||
            showSurvey ||
            !isFaceScanEnabled ||
            !isModelsReady
        ) {
            setFaceDetectionStatus('idle');
            return;
        }

        const intervalId = setInterval(async () => {
            const video = videoRef.current;
            if (!video || video.paused || video.ended || video.readyState < 2) return;
            if (isDetectingRef.current || imageUri || showRecognizedModal) return;

            isDetectingRef.current = true;
            try {
                setFaceDetectionStatus('scanning');
                const snapshot = captureSnapshotFromVideo();
                if (!snapshot) return;

                const result = await recognizeFaceViaServer(snapshot);

                if (result && result.detected) {
                    setFaceDetectionStatus('detected');

                    if (result.matched && result.guest) {
                        setFaceDetectionStatus('recognized');
                        setRecognizedPhoto(snapshot);
                        setRecognizedGuest(result.guest);
                        setRecognitionConfidence(result.similarity || 90);
                        setRecognizedService("");
                        setRecognizedServiceCustom("");
                        setShowRecognizedModal(true);
                        toast.success(`Wajah Dikenali: ${result.guest.name}!`);
                    }
                } else {
                    setFaceDetectionStatus('scanning');
                }
            } catch (err) {
                console.error("Scanner error:", err);
            } finally {
                isDetectingRef.current = false;
            }
        }, 1200);

        return () => clearInterval(intervalId);
    }, [
        locationStatus,
        imageUri,
        showRecognizedModal,
        showSurvey,
        isFaceScanEnabled,
        isModelsReady,
        knownFaces,
        captureSnapshotFromVideo,
    ]);

    // Handle Snap Foto Manual (untuk tamu baru atau jika tidak memakai auto scan)
    const handleSnap = async () => {
        if (isSnapping || !!imageUri) return;
        setIsSnapping(true);

        // Hentikan scanner loop segera agar main thread langsung lega
        isDetectingRef.current = true;

        try {
            const snapshot = captureSnapshotFromVideo();
            if (snapshot) {
                // Tampilkan foto instan ke user dalam 0ms tanpa freeze
                setImageUri(snapshot);
                setFaceDetectionStatus('idle');

                // Ekstraksi descriptor wajah via Server Next.js
                setTimeout(async () => {
                    try {
                        const result = await recognizeFaceViaServer(snapshot);
                        if (result && result.descriptor) {
                            setManualFaceDescriptor(result.descriptor);
                            if (result.matched && result.guest && !formData.nama) {
                                setFormData(prev => ({
                                    ...prev,
                                    nama: result.guest.name,
                                    hp: result.guest.hp || '',
                                    email: result.guest.email || '',
                                    instansi: result.guest.company || '',
                                    alamat: result.guest.address || '',
                                }));
                                toast.info(`Wajah cocok dengan ${result.guest.name}. Data diri diisi otomatis.`);
                            }
                        }
                    } catch (err) {
                        console.error("Gagal mendeteksi wajah pada foto di server:", err);
                    }
                }, 100);
            }
        } finally {
            setIsSnapping(false);
        }
    };

    const handleRetake = () => {
        setImageUri(null);
        setManualFaceDescriptor(null);
        setFaceDetectionStatus('idle');
        isDetectingRef.current = false;
    };

    const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData({ ...formData, nama: name });

        if (name.length > 2) {
            try {
                const res = await api.get(`${baseURL}/api/guest-book/search/${name}`);
                if (res.data && res.data.hp) {
                    const data = res.data;
                    setFormData(prev => ({
                        ...prev,
                        hp: data.hp || '',
                        email: data.email || '',
                        instansi: data.company || '',
                        alamat: data.address || '',
                    }));
                    toast.info("Data diisi otomatis berdasarkan riwayat kunjungan.");
                }
            } catch (err) {}
        }
    };

    const handleReset = () => {
        setFormData({ nama: '', hp: '', email: '', instansi: '', alamat: '', layanan: '', layananCustom: '' });
        setImageUri(null);
        setManualFaceDescriptor(null);
    };

    // ========================================================
    // KONFIRMASI KEDATANGAN DARI POPUP WAJAH DIKENALI
    // ========================================================
    const handleConfirmRecognizedGuest = async () => {
        if (!recognizedGuest || !recognizedService) {
            toast.error("Silakan pilih layanan/tujuan kunjungan Anda!");
            return;
        }

        if (recognizedService === '8' && !recognizedServiceCustom.trim()) {
            toast.error("Harap isi rincian keperluan spesifik untuk Layanan Lainnya!");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                nama: recognizedGuest.name,
                hp: recognizedGuest.hp || '-',
                email: recognizedGuest.email || '',
                instansi: recognizedGuest.company || 'Umum',
                alamat: recognizedGuest.address || '-',
                pangkat: recognizedGuest.pangkat || '',
                jabatan: recognizedGuest.jabatan || '',
                layanan: recognizedService,
                layananCustom: recognizedServiceCustom,
                imageUri: recognizedPhoto, // Foto hasil scan terkini
                face_descriptor: recognizedGuest.descriptor,
                latitude: userCoords?.lat,
                longitude: userCoords?.lng,
                accuracy: userCoords?.acc,
            };

            const res = await api.post(`${baseURL}/api/e-tamu/store`, payload);

            setGuestIdSaved(res.data.data.id);
            setGuestNameSaved(res.data.data.name);
            setTotalGuests(prev => prev + 1);

            setShowRecognizedModal(false);
            setRecognizedGuest(null);
            setRecognizedPhoto(null);

            setShowSurvey(true);
            handleReset();
            toast.success(`Selamat datang kembali, ${recognizedGuest.name}! Presensi Anda berhasil dicatat.`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan data pengunjung via Face Recognition.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDismissRecognizedModal = () => {
        if (recognizedGuest) {
            setFormData({
                nama: recognizedGuest.name,
                hp: recognizedGuest.hp || '',
                email: recognizedGuest.email || '',
                instansi: recognizedGuest.company || '',
                alamat: recognizedGuest.address || '',
                layanan: '',
                layananCustom: '',
            });
            if (recognizedPhoto) {
                setImageUri(recognizedPhoto);
            }
        }
        setShowRecognizedModal(false);
        toast.info("Silakan periksa atau lengkapi formulir pendaftaran manual.");
    };

    // Submit Formulir Manual
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageUri) {
            toast.error('Silakan ambil swafoto (Snap) terlebih dahulu!');
            return;
        }

        setSubmitting(true);
        try {
            const payload = { 
                ...formData, 
                imageUri, 
                face_descriptor: manualFaceDescriptor,
                latitude: userCoords?.lat,
                longitude: userCoords?.lng,
                accuracy: userCoords?.acc
            };
            const res = await api.post(`${baseURL}/api/e-tamu/store`, payload);
            
            setGuestIdSaved(res.data.data.id);
            setGuestNameSaved(res.data.data.name);
            
            // Perbarui daftar lokal jika ada face descriptor baru
            if (manualFaceDescriptor) {
                setKnownFaces(prev => [
                    ...prev.filter(f => f.name.toLowerCase() !== formData.nama.toLowerCase()),
                    {
                        id: res.data.data.id,
                        name: formData.nama,
                        hp: formData.hp,
                        company: formData.instansi,
                        address: formData.alamat,
                        email: formData.email,
                        descriptor: manualFaceDescriptor,
                    }
                ]);
            }

            setTotalGuests(prev => prev + 1);

            setShowSurvey(true);
            handleReset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan data pengunjung, lokasi tidak valid.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSurveySubmit = async (rating: string) => {
        try {
            await api.post(`${baseURL}/api/e-tamu/survey`, { guest_id: guestIdSaved, rating });
            toast.success(`Terima kasih atas penilaian Anda, ${guestNameSaved}! 💙`);
            setShowSurvey(false);
        } catch (err) {
            toast.error('Gagal menyimpan penilaian');
        }
    };

    if (locationStatus === 'checking') {
        return (
            <div className="min-h-screen bg-[#f3f7f6] flex flex-col">
                <NavbarETamu />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <span className="loading loading-spinner loading-lg text-emerald-600 mb-4"></span>
                    <p className="text-slate-600 font-medium">Memeriksa lokasi dan akurasi GPS Anda...</p>
                    <p className="text-sm text-slate-400 mt-2 text-center max-w-sm">Pastikan Anda mengizinkan akses lokasi pada browser untuk melanjutkan.</p>
                </div>
            </div>
        );
    }

    if (locationStatus === 'denied') {
        return (
            <div className="min-h-screen bg-[#f3f7f6] flex flex-col">
                <NavbarETamu />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl">location_off</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Akses Lokasi Ditolak</h2>
                        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                            Buku Tamu ini hanya dapat diakses di area BBPOM di Mataram. Harap berikan izin akses lokasi (GPS) pada pengaturan browser Anda dan pastikan GPS menyala.
                        </p>
                        <button onClick={() => checkLocation(0)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl w-full transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">my_location</span> Cek Ulang Lokasi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (locationStatus === 'too_far') {
        return (
            <div className="min-h-screen bg-[#f3f7f6] flex flex-col">
                <NavbarETamu />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-4xl">share_location</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Lokasi Terlalu Jauh</h2>
                        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                            Anda berada di luar area BBPOM di Mataram. Jarak Anda saat ini adalah <strong className="text-slate-800">{distance} meter</strong>. Anda harus berada di dalam radius maksimal 50 meter.
                        </p>
                        <button onClick={() => checkLocation(0)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl w-full transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">my_location</span> Cek Ulang Lokasi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f7f6] flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-10 relative">
            <NavbarETamu />

            <header className="flex flex-col text-center items-center pt-5 mb-6">
                <Image src="/assets/images/bpomri_without_label.png" alt="logo BPOM" width={70} height={70} className="mb-2 w-auto h-auto" priority />
                <h1 className="text-black font-bold text-3xl">E Tamu - BBPOM di Mataram</h1>
            </header>

            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* SISI KIRI: TOTAL PENGUNJUNG & KAMERA SWAFOTO / SCANNER */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Total Pengunjung
                                </h3>
                                {knownFaces.length > 0 && (
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                                        {knownFaces.length} Wajah Terdaftar
                                    </span>
                                )}
                            </div>
                            <div className="flex items-end gap-3 mb-2">
                                <span className="text-5xl font-black text-slate-800">{totalGuests}</span>
                                <div className="mb-1.5 text-sm text-slate-500 font-medium">Pengunjung</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">Swafoto & Face Recognition</h3>
                                        <p className="text-[11px] text-slate-500">Scan otomatis tamu terdaftar</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsFaceScanEnabled(!isFaceScanEnabled)}
                                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                                        isFaceScanEnabled 
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                            : "bg-slate-100 text-slate-500 border-slate-200"
                                    }`}
                                    title="Klik untuk aktifkan/nonaktifkan pemindai wajah otomatis"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isFaceScanEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                                    {isFaceScanEnabled ? "AI Scan: ON" : "AI Scan: OFF"}
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                                    <span className="material-symbols-outlined text-[14px]">videocam</span> Pilih Sumber Kamera
                                </label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    value={selectedCamera}
                                    onChange={(e) => setSelectedCamera(e.target.value)}
                                >
                                    {cameras.map((cam, i) => (
                                        <option key={cam.deviceId} value={cam.deviceId}>{cam.label || `Kamera ${i + 1}`}</option>
                                    ))}
                                </select>
                            </div>

                            {/* CONTAINER VIDEO KAMERA & OVERLAY PEMINDAI */}
                            <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border-[6px] border-slate-100 mb-4 group shadow-inner">
                                {!imageUri ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                                        
                                        {/* Loading Indicator saat kamera pertama dinyalakan */}
                                        {isCameraLoading && (
                                            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-10">
                                                <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                                                <span className="text-slate-300 text-xs font-medium">Menghubungkan Kamera...</span>
                                            </div>
                                        )}
                                        
                                        {/* HUD / Scanning Frame Overlay */}
                                        {isFaceScanEnabled && (
                                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
                                                <div className="w-full flex justify-between items-center">
                                                    <span className="bg-slate-900/60 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/30">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                                        {faceDetectionStatus === 'detected' ? 'Menganalisis Wajah...' : 'Memindai Wajah...'}
                                                    </span>
                                                </div>

                                                {/* Bingkai Target Wajah */}
                                                <div className={`w-44 h-52 border-2 rounded-3xl transition-all duration-300 flex items-center justify-center ${
                                                    faceDetectionStatus === 'detected' 
                                                        ? 'border-emerald-400 bg-emerald-500/10 scale-105' 
                                                        : 'border-white/40 border-dashed'
                                                }`}>
                                                    <span className="bg-slate-900/70 text-slate-200 text-[10px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md">
                                                        {faceDetectionStatus === 'detected' ? 'Wajah Terdeteksi' : 'Arahkan Wajah ke Sini'}
                                                    </span>
                                                </div>

                                                <span className="text-[10px] text-white/80 bg-slate-900/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                                                    Tamu terdaftar akan terisi otomatis
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <img src={imageUri} alt="Selfie Snapshot" className="w-full h-full object-cover transform scale-x-[-1]" />
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={handleSnap} disabled={!!imageUri || isCameraLoading || isSnapping} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
                                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                                    {isSnapping ? 'Mengambil...' : 'Ambil Foto'}
                                </button>
                                <button type="button" onClick={handleRetake} disabled={!imageUri} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px]">refresh</span> Foto Ulang
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-slate-500 mt-4 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-amber-500">lightbulb</span> 
                                Posisikan wajah tepat di dalam bingkai. Tamu yang pernah datang akan otomatis dikenali.
                            </p>
                        </div>
                    </div>

                    {/* SISI KANAN: FORMULIR DATA DIRI PENGUNJUNG */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            
                            <div className="bg-teal-700 p-6 md:p-4 flex justify-between items-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold text-white mb-1">Formulir Data Diri Pengunjung</h2>
                                    <p className="text-teal-100 text-xs">Isi formulir ini jika Anda baru pertama kali berkunjung</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 md:p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">1. Layanan / Unit Tujuan <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">toc</span>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-11 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all appearance-none cursor-pointer"
                                                required 
                                                value={formData.layanan} 
                                                onChange={e => setFormData({...formData, layanan: e.target.value})}
                                            >
                                                <option value="" disabled>== Pilih Jenis Layanan ==</option>
                                                {services.map((item) => (
                                                    <option key={item.id} value={item.id}>{item.name}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3.5 top-3 text-slate-400 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">2. Nama Lengkap Tamu <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">person</span>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-11 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="Contoh: Muhammad Fauzan, S.Farm"
                                                list="guests" 
                                                required 
                                                value={formData.nama} 
                                                onChange={handleNameChange}
                                            />
                                            <datalist id="guests">
                                                {guestNames.map((name, i) => <option key={i} value={name} />)}
                                            </datalist>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">3. Nomor HP / WhatsApp <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">call</span>
                                            <input 
                                                type="tel" 
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-11 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="081234567890"
                                                required 
                                                value={formData.hp} 
                                                onChange={e => setFormData({...formData, hp: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">4. Alamat Email</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">mail</span>
                                            <input 
                                                type="email" 
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-11 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="nama@instansi.go.id"
                                                value={formData.email} 
                                                onChange={e => setFormData({...formData, email: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">5. Asal Instansi / Perusahaan / Kampus <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">apartment</span>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-11 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400"
                                                placeholder="Contoh: Dinas Kesehatan Provinsi NTB / PT. Farmasi Bersama / Umum"
                                                required
                                                value={formData.instansi} 
                                                onChange={e => setFormData({...formData, instansi: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">6. Alamat Lengkap Domisili / Kantor <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 text-[20px]">location_on</span>
                                            <textarea 
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3.5 pl-11 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400 min-h-[80px]"
                                                placeholder="Jalan, No., Kelurahan, Kecamatan, Kota/Kabupaten"
                                                required
                                                value={formData.alamat} 
                                                onChange={e => setFormData({...formData, alamat: e.target.value})} 
                                            />
                                        </div>
                                    </div>

                                    {formData.layanan === '8' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">7. Keperluan Spesifik & Pejabat Yang Dituju <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-slate-400 text-[20px]">chat</span>
                                                <textarea 
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3.5 pl-11 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400 min-h-[80px]"
                                                    placeholder="Misal: Penyerahan sampel uji makanan MD bersama Tim Lab Kimia"
                                                    required
                                                    value={formData.layananCustom} 
                                                    onChange={e => setFormData({...formData, layananCustom: e.target.value})} 
                                                />
                                            </div>
                                        </div>
                                    )}

                                </div>

                                <div className="mt-8 border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-start gap-3">
                                    <label className="text-sm text-slate-600 leading-relaxed">
                                        Dengan menekan tombol <strong className="text-slate-800">SIMPAN</strong>, saya bersedia mematuhi <a href="https://drive.google.com/open?id=11m-Ef8JQqDoXWt_AQYNPScooohOz8kI1&usp=drive_fs" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">peraturan dan norma K3</a> yang berlaku di BBPOM di Mataram
                                    </label>
                                </div>

                                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                                    <button 
                                        type="submit" 
                                        disabled={submitting} 
                                        className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-base"
                                    >
                                        {submitting ? 'MEMPROSES...' : 'SIMPAN'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleReset} 
                                        disabled={submitting}
                                        className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">sync</span> RESET
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* POPUP WAJAH DIKENALI (MODAL KONFIRMASI KEDATANGAN CEPAT) */}
            {showRecognizedModal && recognizedGuest && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
                        {/* Header Modal */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
                            <button
                                onClick={() => setShowRecognizedModal(false)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                            <h3 className="text-xl font-black">Selamat Datang Kembali!</h3>
                            <p className="text-emerald-100 text-xs mt-0.5">Identitas Anda terdeteksi melalui Face Recognition</p>
                        </div>

                        {/* Content Modal */}
                        <div className="p-6 space-y-5">
                            {/* Kartu Ringkasan Tamu & Foto Terkini */}
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                {recognizedPhoto && (
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-emerald-500 shadow-sm">
                                        <img src={recognizedPhoto} alt="Tangkapan Wajah" className="w-full h-full object-cover transform scale-x-[-1]" />
                                        <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[10px]">check</span>
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-bold text-slate-800 truncate">{recognizedGuest.name}</h4>
                                    <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                                        {recognizedGuest.company || "Umum / Pribadi"}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">call</span>
                                        {recognizedGuest.hp || "-"}
                                    </p>
                                </div>
                            </div>

                            {/* Dropdown Pemilihan Layanan Tujuan */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                                    Pilih Layanan / Unit Tujuan Hari Ini <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[20px]">toc</span>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-11 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all appearance-none cursor-pointer"
                                        value={recognizedService} 
                                        onChange={e => setRecognizedService(e.target.value)}
                                    >
                                        <option value="" disabled>== Pilih Layanan Tujuan ==</option>
                                        {services.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3.5 top-3 text-slate-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            {recognizedService === '8' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                                        Keperluan Spesifik & Pejabat Yang Dituju <span className="text-red-500">*</span>
                                    </label>
                                    <textarea 
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl py-3 pl-4 pr-4 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-400 min-h-[70px]"
                                        placeholder="Contoh: Koordinasi pengujian sampel dengan Lab Kimia"
                                        value={recognizedServiceCustom}
                                        onChange={e => setRecognizedServiceCustom(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Tombol Aksi */}
                            <div className="space-y-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleConfirmRecognizedGuest}
                                    disabled={!recognizedService || (recognizedService === '8' && !recognizedServiceCustom.trim()) || submitting}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                                    {submitting ? 'Menyimpan Kehadiran...' : 'Konfirmasi Kedatangan & Simpan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDismissRecognizedModal}
                                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                                >
                                    Bukan Saya? Isi Formulir Manual
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP SURVEY MODAL */}
            <PopupSurvey 
                show={showSurvey} 
                guestName={guestNameSaved} 
                onClose={() => setShowSurvey(false)} 
                onSubmit={handleSurveySubmit} 
            />

            {/* POPUP LOADING FULLSCREEN */}
            {submitting && (
                <div className="fixed flex inset-0 bg-slate-900/60 backdrop-blur-sm items-center justify-center z-[9999]">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center min-w-[280px] animate-in zoom-in-95">
                        <span className="loading loading-spinner loading-lg text-emerald-600 mb-5"></span>
                        <h3 className="text-slate-800 font-bold text-lg animate-pulse">Menyimpan Data...</h3>
                        <p className="text-slate-500 text-sm mt-1">Mohon tunggu sebentar</p>
                    </div>
                </div>
            )}

            {/* POPUP PROSEDUR EVAKUASI */}
            {showEvacuationPopup && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] animate-in fade-in duration-300">
                    <div className="relative max-h-[90vh] flex flex-col items-end">
                        <button 
                            onClick={() => setShowEvacuationPopup(false)}
                            className="mb-2 text-white/70 hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                        >
                            Tutup <span className="text-xl leading-none">&times;</span>
                        </button>
                        
                        <div className="relative bg-transparent rounded-xl overflow-hidden max-h-[85vh] w-auto shadow-2xl">
                            <img 
                                src="/assets/images/popup-img.png" 
                                alt="Prosedur Evakuasi Gempa Bumi dan Kebakaran" 
                                className="max-h-[85vh] w-auto object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* WIDGET SIENNA ACCESSIBILITY */}
            <Script src="https://website-widgets.pages.dev/dist/sienna.min.js" strategy="lazyOnload" />
            
        </div>
    );
}
