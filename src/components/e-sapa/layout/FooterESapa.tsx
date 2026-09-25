import Image from "next/image";

export default function FooterESapa() {
    return (
        <footer className="px-8 py-5 mt-auto border-t border-slate-200 bg-white">
            <div className="flex items-center gap-4 text-slate-600">
                <Image 
                    src="/assets/images/bpomri_without_label.png" 
                    alt="logo bpom" 
                    width={35} 
                    height={35} 
                    className="hidden sm:block opacity-80" 
                />
                <div className="flex flex-col">
                    <p className="text-[12px] leading-tight text-slate-500">Aplikasi Kegiatan Mencakup Pertanggungjawaban</p>
                    <p className="font-bold text-[13px] leading-tight text-slate-700">Balai Besar Pengawas Obat dan Makanan di Mataram</p>
                </div>
            </div>
        </footer>
    );
}