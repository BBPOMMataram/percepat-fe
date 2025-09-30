"use client";

import RegisterForm from "@/components/main/RegisterForm";
import ParticlesBackground from "@/components/simandalika/hero/ParticlesBackground";
import { Suspense, useState } from "react";

export default function RegisterPage() {
  const [particleColor] = useState("#8b5cf6");

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ParticlesBackground particleColor={particleColor} />
      <RegisterForm />
    </Suspense>
  );
}
