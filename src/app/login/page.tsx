"use client";

import { Suspense, useState } from "react";
import LoginForm from "@/components/main/LoginForm";
import ParticlesBackground from "@/components/simandalika/hero/ParticlesBackground";

export default function LoginPage() {
  const [particleColor, setParticleColor] = useState("#10b981");

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ParticlesBackground particleColor={particleColor} />
      <LoginForm />
    </Suspense>
  );
}
