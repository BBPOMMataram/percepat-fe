/**
 * Utility untuk Face Recognition E-Tamu
 * Menggunakan face-api.min.js lokal dari /assets/js/face-api.min.js
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
 * Cek apakah model AI face-api sudah benar-benar selesai dimuat ke memori
 */
export function isFaceApiReady(): boolean {
    if (typeof window === 'undefined' || !window.faceapi) return false;
    const faceapi = window.faceapi;
    return Boolean(
        faceapi.nets?.tinyFaceDetector?.params &&
        faceapi.nets?.faceLandmark68Net?.params &&
        faceapi.nets?.faceRecognitionNet?.params
    );
}

let modelLoadingPromise: Promise<boolean> | null = null;

/**
 * Memuat bobot model AI Face Recognition dari /models/face
 */
export async function loadFaceRecognitionModels(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Jika model sudah benar-benar siap di memori, langsung return true
    if (isFaceApiReady()) return true;

    if (modelLoadingPromise) return modelLoadingPromise;

    modelLoadingPromise = (async () => {
        try {
            const faceapi = await getFaceApi();
            if (!faceapi) return false;

            if (isFaceApiReady()) return true;

            // Gunakan absolute origin URL agar tidak terpengaruh subpath/trailing slash
            const MODEL_URL = `${window.location.origin}/models/face`;

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);

            return isFaceApiReady();
        } catch (error) {
            console.error("Gagal memuat model face recognition:", error);
            return false;
        } finally {
            modelLoadingPromise = null;
        }
    })();

    return modelLoadingPromise;
}

/**
 * Deteksi wajah tunggal dan ekstrak Face Descriptor (vektor 128 dimensi)
 */
export async function detectFaceDescriptor(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<{ descriptor: number[]; box?: { x: number; y: number; width: number; height: number } } | null> {
    try {
        const isLoaded = await loadFaceRecognitionModels();
        if (!isLoaded) return null;

        const faceapi = await getFaceApi();
        if (!faceapi || !faceapi.nets?.tinyFaceDetector?.params) return null;

        // Gunakan TinyFaceDetector untuk performa tinggi & hemat resource
        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
        });

        const detection = await faceapi
            .detectSingleFace(input, options)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection || !detection.descriptor) {
            return null;
        }

        const box = detection.detection.box;

        return {
            descriptor: Array.from(detection.descriptor),
            box: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
            },
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
 * Nilai threshold standar face-api: 0.50 (makin kecil makin ketat)
 */
export function findBestFaceMatch(
    queryDescriptor: number[],
    knownGuests: KnownGuestFace[],
    threshold = 0.50
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
