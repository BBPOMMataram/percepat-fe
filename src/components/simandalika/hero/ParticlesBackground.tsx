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
                fullScreen: { enable: false },
                background: { color: "transparent" },
                particles: {
                    number: { value: 50 },
                    color: { value: particleColor },
                    size: { value: 3 },
                    move: { enable: true, speed: .3 },
                    links: {
                        enable: true,
                        color: "#cbd5e1",
                        distance: 100,
                        opacity: 0.4,
                    },
                    opacity: { value: .5 },
                },
            }}
            className="absolute inset-0 -z-10"
        />
    );
};

export default ParticlesBackground;
