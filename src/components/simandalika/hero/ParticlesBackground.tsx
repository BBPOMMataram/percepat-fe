"use client";
import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const ParticlesBackground = ({ particleColor }: { particleColor: string }) => {
    const particlesInit = useCallback(async (engine: any) => {
        if (
            typeof document !== "undefined" &&
            (document.documentElement.classList.contains("legacy-win") ||
                document.documentElement.getAttribute("data-legacy-browser") === "true")
        ) {
            return;
        }

        try {
            await loadSlim(engine); // gunakan Slim daripada Full
        } catch (e) {
            console.warn("Particles failed to init:", e);
        }
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
                fpsLimit: 45,
                pauseOnBlur: true,
                fullScreen: { enable: true, zIndex: 0 },
                background: { color: "transparent" },
                particles: {
                    number: { value: 24 },
                    color: { value: particleColor },
                    size: { value: 3.5 },
                    move: {
                        enable: true,
                        speed: 0.6,
                        direction: "none",
                        outModes: { default: "bounce" }
                    },
                    links: {
                        enable: true,
                        color: particleColor,
                        distance: 190,
                        opacity: 0.35,
                    },
                    opacity: { value: 0.5 },
                },
                detectRetina: false,
            }}
        />
    );
};

export default ParticlesBackground;
