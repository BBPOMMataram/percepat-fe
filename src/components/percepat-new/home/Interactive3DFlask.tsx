"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Interactive3DFlask() {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clean any existing canvas/children
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const width = container.clientWidth || 360;
        const height = container.clientHeight || 360;

        // Scene, Camera, High-performance WebGL Renderer
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
        camera.position.set(0, 2.3, 8.2);
        camera.lookAt(0, 1.9, 0);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        // --- Hierarchy for physical motion ---
        // 1. tiltGroup: Anchored at base (0, 0, 0).
        const tiltGroup = new THREE.Group();
        tiltGroup.position.set(0, 0, 0);
        scene.add(tiltGroup);

        // 2. flaskGroup: Child of tiltGroup. Pivoted at base (y = 0).
        const flaskGroup = new THREE.Group();
        flaskGroup.position.set(0, 0, 0);
        tiltGroup.add(flaskGroup);

        // --- 1. Inner Reagent Liquid (Rendered First with depthWrite = true) ---
        // Liquid is solid, uniform, constant BPOM blue (#0284c7).
        // It writes to depth buffer so stickers/labels on the back side are naturally occluded!
        const liquidPoints: THREE.Vector2[] = [
            new THREE.Vector2(0, 0.18),
            new THREE.Vector2(1.5, 0.18),
            new THREE.Vector2(1.63, 0.3),
            new THREE.Vector2(1.45, 0.8),
            new THREE.Vector2(1.18, 1.45),
            new THREE.Vector2(1.05, 1.75), // Surface level
            new THREE.Vector2(0, 1.75),    // Top closed surface (no pale meniscus needed)
        ];

        const liquidGeometry = new THREE.LatheGeometry(liquidPoints, 32);
        const liquidMaterial = new THREE.MeshBasicMaterial({
            color: 0x0169c2, // Deep, rich, saturated vibrant BPOM blue (never fades)
            transparent: false,
            depthWrite: true,
            side: THREE.FrontSide,
        });

        const liquidMesh = new THREE.Mesh(liquidGeometry, liquidMaterial);
        liquidMesh.renderOrder = 1;
        flaskGroup.add(liquidMesh);

        // --- 2. Seamless 360° Conical Sleeve (Front: PERCEPAT Label, Back: ONLY BPOM Logo) ---
        // Matches outer glass radius (+0.003 offset) so it never protrudes from silhouette
        const sleevePoints: THREE.Vector2[] = [
            new THREE.Vector2(1.603, 0.8),
            new THREE.Vector2(1.453, 1.15),
            new THREE.Vector2(1.303, 1.5),
            new THREE.Vector2(1.123, 1.85),
            new THREE.Vector2(0.953, 2.2),
        ];

        const sleeveGeometry = new THREE.LatheGeometry(sleevePoints, 40, 0, Math.PI * 2);

        // Crisp 2K Canvas (2048 x 1024) with bold, high-contrast typography
        const canvas = document.createElement("canvas");
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");

        // Helper to draw authentic QR Code on 2K canvas
        const drawQrPattern = (c: CanvasRenderingContext2D, qx: number, qy: number, qw: number, qh: number) => {
            c.fillStyle = "#ffffff";
            c.fillRect(qx, qy, qw, qh);

            c.fillStyle = "#000000";
            const drawFinder = (fx: number, fy: number, s: number) => {
                c.fillStyle = "#000000";
                c.fillRect(fx, fy, s, s);
                c.fillStyle = "#ffffff";
                c.fillRect(fx + s * 0.18, fy + s * 0.18, s * 0.64, s * 0.64);
                c.fillStyle = "#000000";
                c.fillRect(fx + s * 0.36, fy + s * 0.36, s * 0.28, s * 0.28);
            };

            const markerSize = qw * 0.26;
            drawFinder(qx + 5, qy + 5, markerSize);
            drawFinder(qx + qw - markerSize - 5, qy + 5, markerSize);
            drawFinder(qx + 5, qy + qh - markerSize - 5, markerSize);

            c.fillStyle = "#000000";
            const cellSize = qw / 14;
            const matrix = [
                [0,0,0,0,0,0,0,1,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,1,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                [0,0,0,0,0,0,0,1,1,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                [0,0,0,0,0,0,0,1,0,1,0,0,0,0],
                [0,0,0,0,0,0,0,0,1,0,0,0,0,0],
                [1,1,0,1,0,1,0,1,0,1,0,1,1,0],
                [0,0,1,1,0,1,1,0,1,0,1,0,0,1],
                [0,0,0,0,0,0,0,1,1,0,1,1,0,1],
                [0,0,0,0,0,0,0,0,1,1,0,1,1,0],
                [0,0,0,0,0,0,0,1,0,0,1,0,1,1],
                [0,0,0,0,0,0,0,1,1,0,1,0,0,1],
                [0,0,0,0,0,0,0,0,1,1,0,1,1,0],
            ];

            for (let r = 0; r < 14; r++) {
                for (let col = 0; col < 14; col++) {
                    if (matrix[r][col] === 1) {
                        c.fillRect(qx + col * cellSize, qy + r * cellSize, cellSize * 0.9, cellSize * 0.9);
                    }
                }
            }
        };

        // Render entire dual-sided texture
        const renderTexture = (bpomImage?: HTMLImageElement) => {
            if (!ctx) return;
            ctx.clearRect(0, 0, 2048, 1024);

            // ==========================================
            // 1. FRONT SIDE: LABEL STIKER PERCEPAT (Center at x = 512)
            // Sized to stay on front face and never clip side silhouettes
            // ==========================================
            const fw = 460;
            const fh = 720;
            const fx = 512 - fw / 2; // 282
            const fy = 150;
            const fr = 20;

            // White sticker card
            ctx.fillStyle = "#ffffff";
            if (typeof ctx.roundRect === "function") {
                ctx.roundRect(fx, fy, fw, fh, fr);
                ctx.fill();
            } else {
                ctx.fillRect(fx, fy, fw, fh);
            }

            // Blue border matching LabelStikerModal
            ctx.strokeStyle = "#0284c7";
            ctx.lineWidth = 4.5;
            if (typeof ctx.roundRect === "function") {
                ctx.roundRect(fx, fy, fw, fh, fr);
                ctx.stroke();
            }

            // --- Top QR Code (136x136 px) ---
            drawQrPattern(ctx, fx + 24, fy + 24, 136, 136);

            // --- Top Right Header: BADAN POM & Expired Date ---
            ctx.fillStyle = "#000000";
            ctx.font = "bold 26px Arial, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("BADAN POM", fx + 176, fy + 56);

            ctx.fillStyle = "#0284c7";
            ctx.font = "bold 20px Arial, sans-serif";
            ctx.fillText("Expired Date", fx + 176, fy + 94);

            ctx.fillStyle = "#000000";
            ctx.font = "900 38px Arial, sans-serif";
            ctx.fillText("31-Des-2026", fx + 176, fy + 144);

            // --- Subtitle: Reagent Item Name ---
            ctx.fillStyle = "#0f172a";
            ctx.font = "italic bold 16px Arial, sans-serif";
            ctx.fillText("RG-2026-001: Asam Klorida (HCl) P.A.", fx + 24, fy + 198);

            // --- Section: DITERIMA DI LAB ---
            ctx.fillStyle = "#000000";
            ctx.font = "bold 19px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("D I T E R I M A   D I   L A B", fx + fw / 2, fy + 244);

            ctx.textAlign = "left";
            ctx.font = "bold 17px Arial, sans-serif";
            ctx.fillText("TANGGAL  :", fx + 26, fy + 288);
            ctx.font = "normal 17px Arial, sans-serif";
            ctx.fillStyle = "#000000";
            ctx.fillText("21 Oktober 2026", fx + 180, fy + 288);

            ctx.fillStyle = "#000000";
            ctx.font = "bold 17px Arial, sans-serif";
            ctx.fillText("PENERIMA :", fx + 26, fy + 330);
            ctx.font = "normal 17px Arial, sans-serif";
            ctx.fillStyle = "#000000";
            ctx.fillText("Laboratorium Kimia", fx + 180, fy + 330);

            // --- Blue Middle Divider ---
            ctx.strokeStyle = "#0284c7";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(fx + 20, fy + 366);
            ctx.lineTo(fx + fw - 20, fy + 366);
            ctx.stroke();

            // --- Section: DIBUKA ---
            ctx.fillStyle = "#000000";
            ctx.font = "bold 19px Arial, sans-serif";
            ctx.fillText("D I B U K A", fx + 26, fy + 406);

            ctx.font = "bold 17px Arial, sans-serif";
            ctx.fillText("OLEH          :", fx + 26, fy + 450);
            ctx.font = "normal 17px Arial, sans-serif";
            ctx.fillStyle = "#000000";
            ctx.fillText("Analis BBPOM", fx + 180, fy + 450);

            ctx.fillStyle = "#000000";
            ctx.font = "bold 17px Arial, sans-serif";
            ctx.fillText("TANGGAL   :", fx + 26, fy + 492);
            ctx.font = "normal 17px Arial, sans-serif";
            ctx.fillStyle = "#000000";
            ctx.fillText("21-Okt-2026", fx + 180, fy + 492);

            // --- Barcode Strip ---
            ctx.fillStyle = "#000000";
            for (let i = 0; i < 24; i++) {
                const bx = fx + 36 + i * 16.5;
                const bw = (i % 3 === 0) ? 5 : 2.5;
                ctx.fillRect(bx, fy + 535, bw, 34);
            }

            // --- Sticker Footer Banner ---
            ctx.fillStyle = "#f0f9ff";
            if (typeof ctx.roundRect === "function") {
                ctx.roundRect(fx + 18, fy + 595, fw - 36, 68, 10);
                ctx.fill();
            } else {
                ctx.fillRect(fx + 18, fy + 595, fw - 36, 68);
            }
            ctx.strokeStyle = "#bae6fd";
            ctx.lineWidth = 1.5;
            if (typeof ctx.roundRect === "function") {
                ctx.roundRect(fx + 18, fy + 595, fw - 36, 68, 10);
                ctx.stroke();
            }

            ctx.fillStyle = "#0284c7";
            ctx.font = "bold 16px Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("SISTEM PERCEPAT • BBPOM DI MATARAM", fx + fw / 2, fy + 638);

            // ==========================================
            // 2. BACK SIDE: ONLY OFFICIAL BADAN POM LOGO (Center at x = 1536)
            // NO white card, NO border, NO extra text - Pure clean official logo on glass
            // ==========================================
            const bx = 1536;
            const by = 512;

            if (bpomImage && bpomImage.complete && bpomImage.naturalWidth > 0) {
                // Large crisp official BPOM logo directly on transparent glass
                const imgW = 400;
                const imgH = 370;
                ctx.drawImage(bpomImage, bx - imgW / 2, by - imgH / 2, imgW, imgH);
            } else {
                // Vector shield checkmark fallback
                const cx = bx;
                const cy = by - 30;

                ctx.fillStyle = "#004b93";
                ctx.beginPath();
                ctx.moveTo(cx - 95, cy - 40);
                ctx.quadraticCurveTo(cx - 10, cy + 95, cx + 105, cy - 125);
                ctx.lineTo(cx + 80, cy - 134);
                ctx.quadraticCurveTo(cx - 10, cy + 48, cx - 76, cy - 68);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#00a859";
                ctx.beginPath();
                ctx.moveTo(cx + 72, cy - 134);
                ctx.lineTo(cx + 92, cy - 142);
                ctx.quadraticCurveTo(cx + 10, cy + 68, cx - 54, cy - 30);
                ctx.lineTo(cx - 62, cy - 20);
                ctx.quadraticCurveTo(cx + 4, cy + 80, cx + 72, cy - 134);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = "#004b93";
                ctx.font = "900 46px Arial, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("BADAN POM", cx, cy + 140);
            }
        };

        // Render initial canvas
        renderTexture();

        const sleeveTexture = new THREE.CanvasTexture(canvas);
        sleeveTexture.minFilter = THREE.LinearMipmapLinearFilter;
        sleeveTexture.magFilter = THREE.LinearFilter;
        sleeveTexture.generateMipmaps = true;
        if (renderer.capabilities.getMaxAnisotropy) {
            sleeveTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        }
        sleeveTexture.needsUpdate = true;

        // Load official BPOM image for back
        const bpomImg = new window.Image();
        bpomImg.crossOrigin = "anonymous";
        bpomImg.src = "/assets/images/bpom.webp";
        bpomImg.onload = () => {
            renderTexture(bpomImg);
            sleeveTexture.needsUpdate = true;
        };

        const sleeveMaterial = new THREE.MeshBasicMaterial({
            map: sleeveTexture,
            transparent: true,
            opacity: 0.98,
            side: THREE.FrontSide,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
        });

        const sleeveMesh = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
        // Align u=0.25 (Front label) facing camera (+Z)
        sleeveMesh.rotation.y = -Math.PI / 2;
        sleeveMesh.renderOrder = 2;
        flaskGroup.add(sleeveMesh);

        // --- 3. Outer Glass Flask (Rendered on top with clearcoat highlights) ---
        const glassPoints: THREE.Vector2[] = [
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1.65, 0.05),
            new THREE.Vector2(1.8, 0.25),
            new THREE.Vector2(1.6, 0.8),
            new THREE.Vector2(1.3, 1.5),
            new THREE.Vector2(0.95, 2.2),
            new THREE.Vector2(0.66, 2.7),
            new THREE.Vector2(0.54, 3.1),
            new THREE.Vector2(0.54, 4.0),
            // Rim lip
            new THREE.Vector2(0.64, 4.15),
            new THREE.Vector2(0.68, 4.25),
            new THREE.Vector2(0.6, 4.28),
            // Inner surface (double-walled glass)
            new THREE.Vector2(0.46, 4.15),
            new THREE.Vector2(0.46, 3.1),
            new THREE.Vector2(0.58, 2.7),
            new THREE.Vector2(0.86, 2.2),
            new THREE.Vector2(1.2, 1.5),
            new THREE.Vector2(1.5, 0.8),
            new THREE.Vector2(1.68, 0.3),
            new THREE.Vector2(1.52, 0.15),
            new THREE.Vector2(0, 0.15),
        ];

        const glassGeometry = new THREE.LatheGeometry(glassPoints, 36);
        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.05,
            roughness: 0.02,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            reflectivity: 1.0,
            transparent: true,
            opacity: 0.16, // Crystal clear glass: 92% transparent, eliminates milky haze over liquid
            depthWrite: false,
            side: THREE.FrontSide,
        });

        const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
        glassMesh.renderOrder = 3;
        flaskGroup.add(glassMesh);

        // --- 4. Micro Bubbles Floating Inside Liquid (Lightweight 6 bubbles) ---
        const bubbleGeo = new THREE.SphereGeometry(1, 8, 8);
        const bubbleMat = new THREE.MeshBasicMaterial({
            color: 0xbae6fd,
            transparent: true,
            opacity: 0.7,
        });
        const bubbles: {
            mesh: THREE.Mesh;
            baseX: number;
            baseZ: number;
            speed: number;
            phase: number;
        }[] = [];

        for (let i = 0; i < 6; i++) {
            const mesh = new THREE.Mesh(bubbleGeo, bubbleMat);
            const r = 0.2 + Math.random() * 0.85;
            const a = Math.random() * Math.PI * 2;
            const s = 0.035 + Math.random() * 0.03;
            mesh.scale.set(s, s, s);
            mesh.position.set(
                Math.cos(a) * r,
                0.3 + Math.random() * 1.3,
                Math.sin(a) * r
            );
            flaskGroup.add(mesh);
            bubbles.push({
                mesh,
                baseX: mesh.position.x,
                baseZ: mesh.position.z,
                speed: 0.005 + Math.random() * 0.007,
                phase: Math.random() * Math.PI * 2,
            });
        }

        // --- 5. Soft Floor Shadow beneath the base ---
        const shadowGeometry = new THREE.PlaneGeometry(4.2, 4.2);
        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 64;
        shadowCanvas.height = 64;
        const sCtx = shadowCanvas.getContext("2d");
        if (sCtx) {
            const gradient = sCtx.createRadialGradient(32, 32, 0, 32, 32, 30);
            gradient.addColorStop(0, "rgba(15, 23, 42, 0.26)");
            gradient.addColorStop(0.5, "rgba(15, 23, 42, 0.07)");
            gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
            sCtx.fillStyle = gradient;
            sCtx.fillRect(0, 0, 64, 64);
        }
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            map: shadowTexture,
            transparent: true,
            depthWrite: false,
        });
        const shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -0.02;
        scene.add(shadowPlane);

        // --- 6. Studio Lighting ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);

        const frontLight = new THREE.DirectionalLight(0xffffff, 0.9);
        frontLight.position.set(0, 5, 8);
        scene.add(frontLight);

        // --- 7. Interactive Tilt (Left/Right) & Precession Swirling Motion ---
        let currentTiltZ = 0;
        let targetTiltZ = 0;
        let isDragging = false;
        let startX = 0;
        let startTiltZ = 0;

        const onPointerDown = (clientX: number) => {
            isDragging = true;
            startX = clientX;
            startTiltZ = targetTiltZ;
        };

        const onPointerMove = (clientX: number) => {
            if (!isDragging) return;
            const deltaX = clientX - startX;
            const tilt = startTiltZ - (deltaX * 0.005);
            targetTiltZ = Math.max(-0.42, Math.min(0.42, tilt));
        };

        const onPointerUp = () => {
            isDragging = false;
        };

        const domEl = renderer.domElement;

        const handleMouseDown = (e: MouseEvent) => {
            onPointerDown(e.clientX);
        };
        const handleMouseMove = (e: MouseEvent) => {
            onPointerMove(e.clientX);
        };
        const handleMouseUp = () => {
            onPointerUp();
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                onPointerDown(e.touches[0].clientX);
            }
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 1) {
                onPointerMove(e.touches[0].clientX);
            }
        };
        const handleTouchEnd = () => {
            onPointerUp();
        };

        domEl.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mouseup", handleMouseUp);

        domEl.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        window.addEventListener("touchend", handleTouchEnd);

        // Resize handler
        const handleResize = () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);

        // --- 8. 60-120fps Optimized Render Loop ---
        let animationFrameId: number;
        let theta = 0;
        const swirlAngle = 0.11; // ~6.3 degrees orbital nutation angle

        const animate = () => {
            theta += 0.014;

            // Smooth spring damping towards user tilt
            currentTiltZ += (targetTiltZ - currentTiltZ) * 0.1;

            if (!isDragging) {
                targetTiltZ *= 0.95;
            }

            // Precession Swirl (Nutation around base)
            flaskGroup.rotation.x = Math.sin(theta) * swirlAngle;
            flaskGroup.rotation.z = Math.cos(theta) * swirlAngle + currentTiltZ;
            flaskGroup.rotation.y = -theta;

            // Bubbles animation
            for (let i = 0; i < bubbles.length; i++) {
                const b = bubbles[i];
                b.mesh.position.y += b.speed;
                b.phase += 0.035;
                b.mesh.position.x = b.baseX + Math.sin(b.phase) * 0.03;
                if (b.mesh.position.y > 1.7) {
                    b.mesh.position.y = 0.25 + Math.random() * 0.15;
                }
            }

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
            domEl.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            domEl.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);

            glassGeometry.dispose();
            glassMaterial.dispose();
            liquidGeometry.dispose();
            liquidMaterial.dispose();
            sleeveGeometry.dispose();
            sleeveMaterial.dispose();
            sleeveTexture.dispose();
            bubbleGeo.dispose();
            bubbleMat.dispose();
            shadowGeometry.dispose();
            shadowMaterial.dispose();
            shadowTexture.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div className="relative w-full aspect-square max-w-[340px] sm:max-w-[400px] select-none flex items-center justify-center cursor-ew-resize bg-transparent">
            <div
                ref={containerRef}
                className="w-full h-full flex items-center justify-center pointer-events-auto bg-transparent"
            />
        </div>
    );
}
