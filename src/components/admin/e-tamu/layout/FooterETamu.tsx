"use client";

export default function FooterETamu() {
    return (
        <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                    © {new Date().getFullYear()} Balai Besar POM di Mataram. Hak Cipta Dilindungi Undang-Undang.
                </div>

            </div>
        </footer>
    );
}