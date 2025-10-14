"use client";

import LoginForm from "@/components/main/LoginForm";
import ParticlesBackground from "@/components/simandalika/hero/ParticlesBackground";
import { Suspense, useState } from "react";

export default function LoginPage() {
  const [particleColor] = useState("#10b981");

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ParticlesBackground particleColor={particleColor} />
      <LoginForm />
    </Suspense>
  );
}
