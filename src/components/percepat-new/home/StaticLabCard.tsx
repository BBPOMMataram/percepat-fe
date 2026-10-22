"use client";

import React from "react";

export default function StaticLabCard() {
    return (
        <div className="w-full flex items-center justify-center p-4">
            {/* Hanya Menampilkan Visual Ilustrasi Lab Flask Erlenmeyer Saja (Bersih, Tanpa Tombol / Kartu Tambahan) */}
            <div className="relative w-64 h-72 sm:w-80 sm:h-88 flex items-center justify-center">
                
                {/* Subtle Ground Shadow */}
                <div className="absolute -bottom-2 w-48 h-6 bg-slate-300/40 rounded-full blur-md" />

                {/* Clean, Elegant Erlenmeyer Flask SVG */}
                <svg
                    viewBox="0 0 200 240"
                    className="w-full h-full drop-shadow-lg filter transition-transform hover:scale-105 duration-300"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        {/* Blue Chemical Liquid Gradient */}
                        <linearGradient id="reagentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="50%" stopColor="#005baa" />
                            <stop offset="100%" stopColor="#004281" />
                        </linearGradient>

                        {/* Glass Rim & Reflection Gradient */}
                        <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
                        </linearGradient>

                        {/* Liquid Surface Gradient */}
                        <linearGradient id="surfaceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                    </defs>

                    {/* Outer Glass Flask Body (Erlenmeyer Shape) */}
                    <path
                        d="M85 24 L115 24 L115 75 L175 195 A 20 20 0 0 1 158 224 L42 224 A 20 20 0 0 1 25 195 L85 75 Z"
                        fill="rgba(248, 250, 252, 0.45)"
                        stroke="#005baa"
                        strokeWidth="4.5"
                        strokeLinejoin="round"
                    />

                    {/* Blue Reagent Liquid Fill (Inside Flask) */}
                    <path
                        d="M42 222 L158 222 A 18 18 0 0 0 173 196 L143 135 L57 135 L27 196 A 18 18 0 0 0 42 222 Z"
                        fill="url(#reagentGradient)"
                    />

                    {/* Liquid Meniscus / Top Surface */}
                    <ellipse
                        cx="100"
                        cy="135"
                        rx="43"
                        ry="6.5"
                        fill="url(#surfaceGradient)"
                    />

                    {/* Glass Measurement Tick Marks (Graduation lines) */}
                    <line x1="88" y1="150" x2="105" y2="150" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                    <line x1="82" y1="170" x2="108" y2="170" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                    <line x1="75" y1="190" x2="112" y2="190" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />

                    {/* Liquid Bubble Accents */}
                    <circle cx="70" cy="180" r="3.5" fill="#ffffff" opacity="0.5" />
                    <circle cx="120" cy="195" r="4.5" fill="#ffffff" opacity="0.4" />
                    <circle cx="95" cy="165" r="2.5" fill="#ffffff" opacity="0.6" />

                    {/* Left Curved Glass Highlight / Specular Reflection */}
                    <path
                        d="M88 78 L35 188 A 12 12 0 0 0 42 205"
                        stroke="#ffffff"
                        strokeWidth="4"
                        strokeLinecap="round"
                        opacity="0.6"
                    />

                    {/* Top Lip of the Flask */}
                    <rect
                        x="79"
                        y="18"
                        width="42"
                        height="8"
                        rx="4"
                        fill="#005baa"
                    />
                    <ellipse
                        cx="100"
                        cy="22"
                        rx="19"
                        ry="3.5"
                        fill="#38bdf8"
                        opacity="0.8"
                    />
                </svg>
            </div>
        </div>
    );
}
