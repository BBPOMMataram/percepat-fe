import { NextRequest, NextResponse } from "next/server";
import path from "path";

// Singleton memori server untuk model & database cache
let faceapi: any = null;
let sharp: any = null;
let modelsLoaded = false;
let modelLoadingPromise: Promise<boolean> | null = null;

let cachedGuests: any[] = [];
let lastGuestFetch = 0;

async function ensureModels() {
    if (modelsLoaded) return true;
    if (modelLoadingPromise) return modelLoadingPromise;

    modelLoadingPromise = (async () => {
        try {
            if (!faceapi) {
                // Muat bundle face-api langsung di lingkungan runtime Node.js tanpa terintersepsi Turbopack
                const nodeRequire = eval("require");
                const faceApiPath = path.join(process.cwd(), "public", "assets", "js", "face-api.min.js");
                faceapi = nodeRequire(faceApiPath);
            }
            if (!sharp) {
                const nodeRequire = eval("require");
                sharp = nodeRequire("sharp");
            }

            const modelPath = path.join(process.cwd(), "public", "models", "face");
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath),
                faceapi.nets.faceLandmark68TinyNet.loadFromDisk(modelPath),
                faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath),
            ]);

            modelsLoaded = true;
            return true;
        } catch (err) {
            console.error("Gagal memuat model face recognition di server:", err);
            modelsLoaded = false;
            return false;
        } finally {
            modelLoadingPromise = null;
        }
    })();

    return modelLoadingPromise;
}

function euclideanDistance(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 1.0;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { image } = body;

        if (!image || typeof image !== "string") {
            return NextResponse.json({ error: "Image data is required" }, { status: 400 });
        }

        const isReady = await ensureModels();
        if (!isReady) {
            return NextResponse.json({ error: "Server AI models not ready" }, { status: 500 });
        }

        // Ekstrak buffer dari Base64 (mendukung JPEG, PNG, WebP)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, "base64");

        // Decode dan resize ke 240x180 via Sharp untuk komputasi cepat di server
        const decoded = await sharp(imgBuffer)
            .resize({ width: 240, height: 180, fit: "inside" })
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const int32 = new Int32Array(decoded.data);
        const tensor = faceapi.tf.tensor3d(int32, [decoded.info.height, decoded.info.width, 3], "int32");

        const opt = new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.45 });
        const detection = await faceapi
            .detectSingleFace(tensor, opt)
            .withFaceLandmarks(true)
            .withFaceDescriptor();

        tensor.dispose();

        if (!detection) {
            return NextResponse.json({
                success: true,
                detected: false,
                matched: false,
            });
        }

        const box = detection.detection.box;
        const descriptor = Array.from(detection.descriptor) as number[];

        // Ambil daftar tamu dari database Laravel jika cache > 60 detik
        const now = Date.now();
        if (now - lastGuestFetch > 60000 || cachedGuests.length === 0) {
            try {
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_ETAMU || "http://localhost:8002";
                const res = await fetch(`${backendUrl}/api/e-tamu/faces`, { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    const list = data?.faces || [];
                    cachedGuests = list.map((item: any) => {
                        let desc = item.face_descriptor;
                        if (typeof desc === "string") {
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
                    lastGuestFetch = now;
                }
            } catch (fErr) {
                console.error("Gagal refresh cache tamu dari backend:", fErr);
            }
        }

        // Pencocokan wajah L2 Euclidean
        const threshold = 0.48;
        let bestMatch: any = null;

        for (const kg of cachedGuests) {
            const distance = euclideanDistance(descriptor, kg.descriptor);
            if (distance < threshold) {
                if (!bestMatch || distance < bestMatch.distance) {
                    bestMatch = { guest: kg, distance };
                }
            }
        }

        if (bestMatch) {
            const similarity = Math.max(0, Math.min(100, Math.round((1 - bestMatch.distance / threshold) * 100)));
            return NextResponse.json({
                success: true,
                detected: true,
                matched: true,
                guest: bestMatch.guest,
                similarity,
                box: { x: box.x, y: box.y, width: box.width, height: box.height },
                descriptor,
            });
        }

        return NextResponse.json({
            success: true,
            detected: true,
            matched: false,
            box: { x: box.x, y: box.y, width: box.width, height: box.height },
            descriptor,
        });
    } catch (error: any) {
        console.error("Error pada server-side face recognize:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
