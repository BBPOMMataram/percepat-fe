"use client";
import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

const ParticlesBackground = () => {
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
                    number: { value: 65 + 13 + 17 },
                    color: { value: "#004282" },
                    size: { value: 2 },
                    move: { enable: true, speed: .3 },
                    links: {
                        enable: true,
                        color: "#cbd5e1",
                        distance: 100,
                        opacity: 0.4,
                    },
                    opacity: { value: .3 },
                },
            }}
            className="absolute inset-0 -z-10"
        />
    );
};

export default ParticlesBackground;
