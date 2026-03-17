"use client"

import { motion } from "framer-motion";
import Image from 'next/image';
import Link from "next/link";

export default function BestEmployeePage() {
    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
            {/* Background Hero Image */}
            <div className="absolute inset-0 z-0">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-purple-900 to-pink-900"></div>

                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] repeat"></div>
                </div>

                {/* Floating Orbs */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 text-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="space-y-8"
                >
                    {/* Main Title */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, delay: 0.2, type: "spring", bounce: 0.3 }}
                        className="flex flex-col items-center space-y-4"
                    >
                        <Image
                            src="/assets/images/bpom.webp"
                            alt="BPOM Logo"
                            width={120}
                            height={120}
                            className="mb-4"
                        />
                        <h2
                            className="text-xl md:text-3xl font-medium bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent"
                            style={{
                                filter: "drop-shadow(0 0 10px rgba(139, 92, 246, 0.2))"
                            }}
                        >
                            BBPOM di Mataram
                        </h2>
                        <h1
                            className="text-4xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-none tracking-tight"
                            style={{
                                textShadow: "0 0 30px rgba(255, 255, 255, 0.3)",
                                filter: "drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))"
                            }}
                        >
                            Best Employee
                        </h1>
                    </motion.div>

                    {/* Subtle underline */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                        className="h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto max-w-2xl"
                    ></motion.div>

                    {/* Login Button */}
                    <Link href={'/login?redirectUrl=/admin/best-employee'}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                            className="pt-8"
                        >
                            <motion.button
                                whileHover={{
                                    scale: 1.05,
                                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full shadow-xl hover:bg-white/20 transition-all duration-300 overflow-hidden"
                            >
                                {/* Button background glow */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"
                                    initial={{ x: "100%" }}
                                    whileHover={{ x: 0 }}
                                    transition={{ duration: 0.3 }}
                                />

                                {/* Button content */}
                                <div className="relative z-10 flex items-center space-x-2">
                                    <span>LOGIN</span>
                                    <motion.svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        whileHover={{ x: 3 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </motion.svg>
                                </div>
                            </motion.button>
                        </motion.div>
                    </Link>

                    {/* Floating decorative elements */}
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                rotate: [0, 10, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute top-10 left-1/4 text-4xl opacity-60"
                        >
                            ⭐
                        </motion.div>

                        <motion.div
                            animate={{
                                y: [0, 15, 0],
                                rotate: [0, -10, 0]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1
                            }}
                            className="absolute top-20 right-1/4 text-3xl opacity-60"
                        >
                            🏆
                        </motion.div>

                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                                x: [0, 10, 0]
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 2
                            }}
                            className="absolute bottom-20 left-1/3 text-3xl opacity-60"
                        >
                            🎖️
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Custom CSS for animations */}
            <style jsx>{`
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    )
}
