/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Script from "next/script";
import api from "@/utils/api";
import { toast } from "react-toastify";
import PopupSurvey from "./PopupSurvey";

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
    
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>("");
    const [imageUri, setImageUri] = useState<string | null>(null);

    const [showSurvey, setShowSurvey] = useState(false);
    const [guestIdSaved, setGuestIdSaved] = useState<number | null>(null);
    const [guestNameSaved, setGuestNameSaved] = useState("");

    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL_ETAMU || 'http://localhost:8002';

    // Logika Rekursif Pengecekan Akurasi Lokasi
    const checkLocation = useCallback((retryCount = 0) => {
        setLocationStatus('checking');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude, accuracy } = pos.coords;
                    
                    // Jika akurasi lebih dari 100m (buruk), coba lagi maksimal 5 kali
                    if (accuracy > 100 && retryCount < 5) {
                        setTimeout(() => checkLocation(retryCount + 1), 2000);
                        return;
                    }

                    const dist = getDistanceInMeters(BPOM_LAT, BPOM_LNG, latitude, longitude);
                    setDistance(dist);
                    setUserCoords({ lat: latitude, lng: longitude, acc: accuracy });

                    if (dist <= 50) {
                        setLocationStatus('allowed');
                    } else {
                        setLocationStatus('too_far');
                    }
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setLocationStatus('denied');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationStatus('denied');
        }
    }, []);

    useEffect(() => {
        checkLocation();
    }, [checkLocation]);

    useEffect(() => {
        api.get(`${baseURL}/api/e-tamu/init`).then(res => {
            setServices(res.data.services);
            setGuestNames(res.data.guests);
            setTotalGuests(res.data.guests_this_year);
        }).catch(err => console.error(err));

        navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            setCameras(videoInputs);
            if (videoInputs.length > 0) {
                setSelectedCamera(videoInputs[0].deviceId);
            }
        });
    }, [baseURL]);

    const startCamera = useCallback(async (deviceId?: string) => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        try {
            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error("Camera access denied:", error);
            toast.error("Gagal mengakses kamera. Pastikan izin diberikan.");
        }
    }, []);

    useEffect(() => {
        if (locationStatus === 'allowed' && !imageUri) {
            startCamera(selectedCamera);
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [selectedCamera, startCamera, imageUri, locationStatus]);

    const handleSnap = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = 320;
            canvasRef.current.height = 240;
            context?.drawImage(videoRef.current, 0, 0, 320, 240);
            setImageUri(canvasRef.current.toDataURL('image/jpeg', 0.9));
        }
    };

    const handleRetake = () => {
        setImageUri(null);
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
            } catch (err) { }
        }
    };

    const handleReset = () => {
        setFormData({ nama: '', hp: '', email: '', instansi: '', alamat: '', layanan: '', layananCustom: '' });
        setImageUri(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageUri) {
            toast.error('Silakan ambil swafoto (Snap) terlebih dahulu!');
            return;
        }

        setSubmitting(true);
        try {
            // Mengirim latitude, longitude, dan accuracy asli ke backend untuk divalidasi ulang
            const payload = { 
                ...formData, 
                imageUri, 
                latitude: userCoords?.lat,
                longitude: userCoords?.lng,
                accuracy: userCoords?.acc
            };
            const res = await api.post(`${baseURL}/api/e-tamu/store`, payload);
            
            setGuestIdSaved(res.data.data.id);
            setGuestNameSaved(res.data.data.name);
            
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
            <div className="min-h-screen bg-[#f3f7f6] flex flex-col items-center justify-center p-4">
                <span className="loading loading-spinner loading-lg text-emerald-600 mb-4"></span>
                <p className="text-slate-600 font-medium">Memeriksa lokasi dan akurasi GPS Anda...</p>
                <p className="text-sm text-slate-400 mt-2 text-center max-w-sm">Pastikan Anda mengizinkan akses lokasi pada browser untuk melanjutkan.</p>
            </div>
        );
    }

    if (locationStatus === 'denied') {
        return (
            <div className="min-h-screen bg-[#f3f7f6] flex flex-col items-center justify-center p-4">
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
        );
    }

    if (locationStatus === 'too_far') {
        return (
            <div className="min-h-screen bg-[#f3f7f6] flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-4xl">share_location</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Lokasi Terlalu Jauh</h2>
                    <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                        Anda berada di luar area BBPOM di Mataram. Jarak Anda saat ini adalah <strong className="text-slate-800">{distance} meter</strong>. Anda harus berada di dalam radius maksimal 30 meter.
                    </p>
                    <button onClick={() => checkLocation(0)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl w-full transition-colors flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">my_location</span> Cek Ulang Lokasi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f7f6] flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-10 relative">
            
            <header className="flex flex-col text-center items-center pt-5 mb-6">
                <Image src="/assets/images/bpomri_without_label.png" alt="logo BPOM" width={70} height={70} className="mb-2" />
                <h1 className="text-black font-bold text-3xl">E Tamu - BBPOM di Mataram</h1>
            </header>

            <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Total Pengunjung
                                </h3>
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
                                        <h3 className="text-sm font-bold text-slate-800">Swafoto Pengunjung</h3>
                                    </div>
                                </div>
                                <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] px-2 py-0.5 rounded font-bold">* Diperlukan</span>
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

                            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-[6px] border-slate-100 mb-4 group shadow-inner">
                                {!imageUri ? (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                                ) : (
                                    <img src={imageUri} alt="Selfie Snapshot" className="w-full h-full object-cover transform scale-x-[-1]" />
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={handleSnap} disabled={!!imageUri} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                                    Ambil Foto
                                </button>
                                <button type="button" onClick={handleRetake} disabled={!imageUri} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px]">refresh</span> Foto Ulang
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-slate-500 mt-4 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-amber-500">lightbulb</span> 
                                Posisikan wajah tepat di dalam bingkai dan lepaskan masker sementara.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            
                            <div className="bg-teal-700 p-6 md:p-4 flex justify-between items-center relative overflow-hidden">
                                <div className="relative z-10">
                                    <h2 className="text-2xl font-bold text-white mb-1">Formulir Data Diri Pengunjung</h2>
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
                            className="mb-2 text-white/70 hover:text-white flex items-center gap-1 font-medium transition-colors"
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