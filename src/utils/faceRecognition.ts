/**
 * Utility untuk Face Recognition E-Tamu
 * Menggunakan arsitektur Progressive 2-Stage & Caching
 * Stage 1: TinyFaceDetector (190 KB) dimuat instan (< 0.3s) untuk respon visual cepat
 * Stage 2: FaceLandmarkTiny (77 KB) + FaceRecognition (6.4 MB) dimuat di latar belakang untuk pencocokan identitas
 */

declare global {
    interface Window {
        faceapi: any;
        __faceApiScriptLoading?: Promise<any>;
    }
}

/**
 * Memastikan library faceapi sudah dimuat di window browser secara singleton
 */
export async function getFaceApi(): Promise<any> {
    if (typeof window === 'undefined') return null;
    if (window.faceapi) return window.faceapi;

    if (window.__faceApiScriptLoading) {
        return window.__faceApiScriptLoading;
    }

    window.__faceApiScriptLoading = new Promise((resolve, reject) => {
        // Cek jika script sudah ada di DOM
        const existingScript = document.querySelector<HTMLScriptElement>('script[src*="face-api"]');
        if (existingScript) {
            if (window.faceapi) {
                resolve(window.faceapi);
                return;
            }
            existingScript.addEventListener('load', () => resolve(window.faceapi));
            existingScript.addEventListener('error', (err) => reject(err));
            return;
        }

        const script = document.createElement('script');
        script.src = '/assets/js/face-api.min.js';
        script.async = true;
        script.onload = () => {
            resolve(window.faceapi);
        };
        script.onerror = (err) => {
            console.error("Gagal memuat script face-api.min.js:", err);
            window.__faceApiScriptLoading = undefined;
            reject(err);
        };
        document.head.appendChild(script);
    });

    return window.__faceApiScriptLoading;
}

/**
 * Cek apakah model deteksi wajah awal (TinyFaceDetector, 190 KB) sudah siap
 */
export function isDetectorReady(): boolean {
    if (typeof window === 'undefined' || !window.faceapi) return false;
    return Boolean(window.faceapi.nets?.tinyFaceDetector?.params);
}

/**
 * Cek apakah model pengenalan wajah lengkap (Landmark + Recognition, 6.4 MB) sudah siap
 */
export function isRecognitionReady(): boolean {
    if (typeof window === 'undefined' || !window.faceapi) return false;
    const nets = window.faceapi.nets;
    const hasLandmarks = Boolean(nets?.faceLandmark68TinyNet?.params || nets?.faceLandmark68Net?.params);
    return Boolean(nets?.tinyFaceDetector?.params && hasLandmarks && nets?.faceRecognitionNet?.params);
}

/**
 * Kompatibilitas mundur: bernilai true segera setelah detektor siap agar kamera & HUD langsung aktif
 */
export function isFaceApiReady(): boolean {
    return isDetectorReady();
}

let detectorLoadingPromise: Promise<boolean> | null = null;
let recognitionLoadingPromise: Promise<boolean> | null = null;

/**
 * Tahap 1: Memuat model deteksi wajah cepat (~190 KB) secara instan
 */
export async function loadDetectorModel(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (isDetectorReady()) return true;
    if (detectorLoadingPromise) return detectorLoadingPromise;

    detectorLoadingPromise = (async () => {
        try {
            const faceapi = await getFaceApi();
            if (!faceapi) return false;
            if (isDetectorReady()) return true;

            const MODEL_URL = `${window.location.origin}/models/face`;
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

            // Warmup shader GPU WebGL dengan canvas kecil agar frame pertama instan tanpa lag
            try {
                const dummyCanvas = document.createElement('canvas');
                dummyCanvas.width = 64;
                dummyCanvas.height = 64;
                const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 });
                await faceapi.detectSingleFace(dummyCanvas, opts);
            } catch (wErr) {
                // Abaikan kesalahan warmup dummy
            }

            return isDetectorReady();
        } catch (error) {
            console.error("Gagal memuat model deteksi awal:", error);
            return false;
        } finally {
            detectorLoadingPromise = null;
        }
    })();

    return detectorLoadingPromise;
}

/**
 * Tahap 2: Memuat model pengenalan identitas (Landmarks + 128 Vektor) di latar belakang
 */
export async function loadRecognitionModels(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (isRecognitionReady()) return true;
    if (recognitionLoadingPromise) return recognitionLoadingPromise;

    recognitionLoadingPromise = (async () => {
        try {
            const faceapi = await getFaceApi();
            if (!faceapi) return false;

            // Pastikan detektor awal sudah siap
            await loadDetectorModel();
            if (isRecognitionReady()) return true;

            const MODEL_URL = `${window.location.origin}/models/face`;

            // Muat faceLandmark68TinyNet (hanya 77 KB) & faceRecognitionNet (6.4 MB)
            await Promise.all([
                faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL).catch(() => {
                    // Fallback jika model tiny tidak ditemukan
                    return faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                }),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);

            return isRecognitionReady();
        } catch (error) {
            console.error("Gagal memuat model pengenalan identitas:", error);
            return false;
        } finally {
            recognitionLoadingPromise = null;
        }
    })();

    return recognitionLoadingPromise;
}

/**
 * Memuat model AI secara Progressive:
 * Mengembalikan Promise yang selesai segera setelah Detektor Siap (< 0.3s),
 * sambil meluncurkan pemuatan model pengenalan di latar belakang.
 */
export async function loadFaceRecognitionModels(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Picu pemuatan pengenalan identitas di latar belakang (non-blocking)
    loadRecognitionModels().catch(() => {});

    // Kembalikan segera setelah detektor awal siap agar kamera langsung bereaksi
    return await loadDetectorModel();
}

/**
 * Deteksi wajah tunggal:
 * - Jika recognition model sudah siap: mengekstrak box dan descriptor 128-dimensi.
 * - Jika recognition model masih download di latar belakang: mengekstrak box wajah saja secara instan.
 */
export async function detectFaceDescriptor(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<{ descriptor?: number[]; box?: { x: number; y: number; width: number; height: number }; isReadyForMatch: boolean } | null> {
    try {
        const isLoaded = await loadDetectorModel();
        if (!isLoaded) return null;

        const faceapi = await getFaceApi();
        if (!faceapi || !faceapi.nets?.tinyFaceDetector?.params) return null;

        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
        });

        // Jika model pengenalan sudah siap, lakukan deteksi lengkap + landmark + ekstraksi vektor
        if (isRecognitionReady()) {
            const useTiny = Boolean(faceapi.nets?.faceLandmark68TinyNet?.params);
            const detection = await faceapi
                .detectSingleFace(input, options)
                .withFaceLandmarks(useTiny)
                .withFaceDescriptor();

            if (!detection || !detection.detection) {
                return null;
            }

            const box = detection.detection.box;
            return {
                descriptor: detection.descriptor ? Array.from(detection.descriptor) : undefined,
                box: {
                    x: box.x,
                    y: box.y,
                    width: box.width,
                    height: box.height,
                },
                isReadyForMatch: Boolean(detection.descriptor),
            };
        }

        // Jika model pengenalan masih download, lakukan deteksi kotak wajah super cepat (< 20ms)
        const fastDetection = await faceapi.detectSingleFace(input, options);
        if (!fastDetection) {
            return null;
        }

        const box = fastDetection.box;
        return {
            box: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
            },
            isReadyForMatch: false,
        };
    } catch (error) {
        console.error("Error pada saat mendeteksi wajah:", error);
        return null;
    }
}

/**
 * Hitung jarak Euclidean L2 antara dua vektor 128 dimensi
 */
export function euclideanDistance(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 1.0;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

export interface KnownGuestFace {
    id: number;
    name: string;
    hp?: string;
    company?: string;
    address?: string;
    email?: string;
    pangkat?: string;
    jabatan?: string;
    descriptor: number[];
}

/**
 * Cari tamu yang paling cocok dari daftar tamu terdaftar
 * Nilai threshold standar face-api: 0.48 (makin kecil makin ketat)
 */
export function findBestFaceMatch(
    queryDescriptor: number[],
    knownGuests: KnownGuestFace[],
    threshold = 0.48
): { guest: KnownGuestFace; distance: number; similarity: number } | null {
    let bestMatch: { guest: KnownGuestFace; distance: number } | null = null;

    for (const kg of knownGuests) {
        const distance = euclideanDistance(queryDescriptor, kg.descriptor);
        if (distance < threshold) {
            if (!bestMatch || distance < bestMatch.distance) {
                bestMatch = { guest: kg, distance };
            }
        }
    }

    if (!bestMatch) return null;

    // Hitung persentase kemiripan (aproksimasi untuk UX)
    const similarity = Math.max(0, Math.min(100, Math.round((1 - bestMatch.distance / threshold) * 100)));

    return {
        ...bestMatch,
        similarity,
    };
}
