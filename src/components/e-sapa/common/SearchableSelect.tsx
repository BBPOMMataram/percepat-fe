"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

export interface Option {
    value: string | number;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value?: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    compact?: boolean;
    name?: string;
    id?: string;
}

export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = "-- Pilih --",
    searchPlaceholder = "Ketik untuk mencari...",
    required = false,
    disabled = false,
    className = "",
    compact = false,
    name,
    id,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Selected option object
    const selectedOption = useMemo(() => {
        if (value === undefined || value === null || value === "") return null;
        return options.find((opt) => String(opt.value) === String(value)) || null;
    }, [options, value]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        if (!searchTerm.trim()) return options;
        const query = searchTerm.toLowerCase();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query) ||
                (opt.sublabel && opt.sublabel.toLowerCase().includes(query))
        );
    }, [options, searchTerm]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Auto-focus search input when opening
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        } else {
            setSearchTerm("");
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = (val: string | number) => {
        onChange(String(val));
        setIsOpen(false);
        setSearchTerm("");
    };

    const toggleOpen = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full text-left" id={id}>
            {/* Hidden native input for HTML5 form validation */}
            <input
                type="text"
                tabIndex={-1}
                name={name}
                required={required}
                value={value !== undefined && value !== null ? String(value) : ""}
                onChange={() => {}}
                className="sr-only opacity-0 h-0 w-0 absolute pointer-events-none"
                aria-hidden="true"
            />

            {/* Trigger Button */}
            <button
                type="button"
                onClick={toggleOpen}
                disabled={disabled}
                className={`w-full flex items-center justify-between text-left transition-all border outline-none ${
                    compact
                        ? "py-2 px-3 text-sm rounded-lg"
                        : "py-3 px-4 text-sm rounded-xl"
                } ${
                    disabled
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : isOpen
                        ? "bg-white border-teal-500 ring-2 ring-teal-500/20 text-slate-800 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                } ${className}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="flex-1 truncate mr-2">
                    {selectedOption ? (
                        <span className="font-medium text-slate-800 truncate block">
                            {selectedOption.label}
                        </span>
                    ) : (
                        <span className="text-slate-400 truncate block">{placeholder}</span>
                    )}
                </div>
                <span
                    className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-teal-600" : ""
                    }`}
                >
                    expand_more
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Field */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                        <div className="relative flex items-center">
                            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-2.5 pointer-events-none">
                                search
                            </span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-8 py-2 text-xs md:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-700 placeholder:text-slate-400"
                                onClick={(e) => e.stopPropagation()}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchTerm("");
                                        searchInputRef.current?.focus();
                                    }}
                                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                                    title="Bersihkan pencarian"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 select-none">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = selectedOption?.value !== undefined && String(selectedOption.value) === String(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors flex flex-col justify-center cursor-pointer ${
                                            isSelected
                                                ? "bg-teal-50/80 text-teal-900 font-semibold"
                                                : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 w-full">
                                            <span className="truncate">{opt.label}</span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-[18px] text-teal-600 shrink-0">
                                                    check
                                                </span>
                                            )}
                                        </div>
                                        {opt.sublabel && (
                                            <span
                                                className={`text-[11px] mt-0.5 truncate ${
                                                    isSelected ? "text-teal-700" : "text-slate-400"
                                                }`}
                                            >
                                                {opt.sublabel}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                                Tidak ada data yang sesuai dengan "{searchTerm}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
