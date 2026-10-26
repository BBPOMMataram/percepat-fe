"use client";

import { useState } from "react";
import PercepatNavbar from "./header/PercepatNavbar";
import Hero from "./header/Hero";
import PendingVerifikasiSection from "./home/PendingVerifikasiSection";
import ModernInventory, { CategoryKey } from "./inventory/ModernInventory";
import PercepatFooter from "./footer/PercepatFooter";

export default function Percepat() {
    const [activeCategory, setActiveCategory] = useState<CategoryKey>("reagen");

    return (
        <div className="min-h-screen bg-white text-slate-800 antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between font-sans">
            <div>
                {/* Modern Floating Header */}
                <PercepatNavbar />

                {/* Simplified Animated Hero with 3D Minimalist Glass Object */}
                <Hero />

                {/* Pending Verification Tasks for KaTim, Kabag TU, and Admin */}
                <PendingVerifikasiSection />

                {/* Clean, Interactive Live Inventory Catalog */}
                <ModernInventory
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                />
            </div>

            {/* Dignified Minimalist Footer */}
            <PercepatFooter />
        </div>
    );
}