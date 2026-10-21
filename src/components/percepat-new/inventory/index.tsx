"use client";

import React, { useState } from "react";
import ModernInventory from "./ModernInventory";
import { CategoryKey } from "../home/CategoryCards";

interface InventoryProps {
    initialCategory?: CategoryKey;
    activeCategory?: CategoryKey;
    onCategoryChange?: (cat: CategoryKey) => void;
}

export default function Inventory({
    initialCategory = "reagen",
    activeCategory: controlledCategory,
    onCategoryChange: controlledChange,
}: InventoryProps) {
    const [internalCategory, setInternalCategory] = useState<CategoryKey>(initialCategory);

    const activeCat = controlledCategory !== undefined ? controlledCategory : internalCategory;
    const handleCategoryChange = (cat: CategoryKey) => {
        if (controlledChange) {
            controlledChange(cat);
        } else {
            setInternalCategory(cat);
        }
    };

    return (
        <ModernInventory
            activeCategory={activeCat}
            onCategoryChange={handleCategoryChange}
        />
    );
}