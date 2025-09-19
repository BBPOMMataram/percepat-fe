"use client";
import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const ParticlesBackground = ({ particleColor }: { particleColor: string }) => {
    const particlesInit = useCallback(async (engine: any) => {
        await loadSlim(engine); // gunakan Slim daripada Full
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
                fullScreen: { enable: true },
                background: { color: "transparent" },
                particles: {
                    number: { value: 25 },
                    color: { value: particleColor },
                    size: { value: 4 },
                    move: { enable: true, speed: .6 },
                    links: {
                        enable: true,
                        color: particleColor,
                        distance: 200,
                        opacity: .4,
                    },
                    opacity: { value: .5 },
                },
                noise: {
                    enable: true, // ✅ aktifkan noise
                    delay: { value: 0 },
                    factor: {
                        value: "10", // semakin besar nilainya semakin berombak
                    },
                },
                detectRetina: true,
            }}
        />
    );
};

export default ParticlesBackground;
