"use client";

import React, { useEffect, useRef } from "react";

interface MolecularBackgroundProps {
    className?: string;
}

export default function MolecularBackground({ className = "" }: MolecularBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        // Nonaktifkan canvas loop jika terdeteksi Windows lama
        if (
            document.documentElement.classList.contains("legacy-win") ||
            document.documentElement.getAttribute("data-legacy-browser") === "true"
        ) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        let ctx: CanvasRenderingContext2D | null = null;
        try {
            ctx = canvas.getContext("2d", { alpha: true });
        } catch (e) {
            return;
        }
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
        let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

        const handleResize = () => {
            if (!canvas.parentElement) return;
            width = canvas.width = canvas.parentElement.clientWidth;
            height = canvas.height = canvas.parentElement.clientHeight;
        };
        window.addEventListener("resize", handleResize);

        // Mouse tracking with gentle threshold
        const mouse = {
            x: -1000,
            y: -1000,
            radius: 110,
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        const parent = canvas.parentElement;
        if (parent) {
            parent.addEventListener("mousemove", handleMouseMove, { passive: true });
            parent.addEventListener("mouseleave", handleMouseLeave);
        }

        // Lightweight node count for 60-120fps performance
        const NODE_COUNT = Math.min(26, Math.max(16, Math.floor((width * height) / 32000)));
        const atoms: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            color: string;
            alpha: number;
        }> = [];

        const ATOM_TYPES = [
            { color: "59, 130, 246", radius: 3.5 }, // Blue
            { color: "16, 185, 129", radius: 3 },   // Emerald
            { color: "14, 165, 233", radius: 3 },   // Sky
            { color: "148, 163, 184", radius: 2.5 },// Slate
        ];

        for (let i = 0; i < NODE_COUNT; i++) {
            const type = ATOM_TYPES[i % ATOM_TYPES.length];
            atoms.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.55,
                vy: (Math.random() - 0.5) * 0.55,
                radius: type.radius,
                color: type.color,
                alpha: 0.35 + Math.random() * 0.35,
            });
        }

        // Render loop
        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Update positions
            for (let i = 0; i < atoms.length; i++) {
                const a = atoms[i];
                a.x += a.vx;
                a.y += a.vy;

                if (a.x < 0 || a.x > width) a.vx *= -1;
                if (a.y < 0 || a.y > height) a.vy *= -1;

                // Mouse interaction with fast distance check
                const dxMouse = a.x - mouse.x;
                const dyMouse = a.y - mouse.y;
                if (Math.abs(dxMouse) < mouse.radius && Math.abs(dyMouse) < mouse.radius) {
                    const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
                    const radiusSq = mouse.radius * mouse.radius;
                    if (distMouseSq < radiusSq) {
                        const dist = Math.sqrt(distMouseSq);
                        const force = (mouse.radius - dist) / mouse.radius;
                        const angle = Math.atan2(dyMouse, dxMouse);
                        a.x += Math.cos(angle) * force * 2;
                        a.y += Math.sin(angle) * force * 2;
                    }
                }
            }

            // Batch draw molecular bond lines (single beginPath & stroke for massive performance boost)
            ctx.beginPath();
            ctx.strokeStyle = "rgba(59, 130, 246, 0.16)";
            ctx.lineWidth = 1;

            const maxDist = 120;
            const maxDistSq = maxDist * maxDist;

            for (let i = 0; i < atoms.length; i++) {
                const a = atoms[i];
                for (let j = i + 1; j < atoms.length; j++) {
                    const b = atoms[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;

                    // Fast bounding box check before hypotenuse
                    if (Math.abs(dx) < maxDist && Math.abs(dy) < maxDist) {
                        const distSq = dx * dx + dy * dy;
                        if (distSq < maxDistSq) {
                            ctx.moveTo(a.x, a.y);
                            ctx.lineTo(b.x, b.y);
                        }
                    }
                }

                // Mouse connection line
                const dxM = a.x - mouse.x;
                const dyM = a.y - mouse.y;
                if (Math.abs(dxM) < mouse.radius && Math.abs(dyM) < mouse.radius) {
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(mouse.x, mouse.y);
                }
            }
            ctx.stroke();

            // Draw Atom Nodes (No CPU shadowBlur for instant GPU-accelerated 2D canvas)
            for (let i = 0; i < atoms.length; i++) {
                const a = atoms[i];

                // Outer halo
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.radius * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${a.color}, ${a.alpha * 0.25})`;
                ctx.fill();

                // Solid nucleus
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${a.color}, ${a.alpha})`;
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
            if (parent) {
                parent.removeEventListener("mousemove", handleMouseMove);
                parent.removeEventListener("mouseleave", handleMouseLeave);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
            style={{ opacity: 0.8 }}
        />
    );
}
