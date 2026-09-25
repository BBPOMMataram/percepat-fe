import Image from "next/image";

export default function FooterESapa() {
    return (
        <footer className="footer px-10 py-4 border-t bg-base-300 text-base-content border-base-300 mt-auto">
            <aside className="items-center grid-flow-col gap-4">
                <Image 
                    src="/assets/images/bpomri_without_label.png" 
                    alt="logo bpom" 
                    width={35} 
                    height={35} 
                    className="hidden sm:block" 
                />
                <div className="flex flex-col">
                    <p className="text-sm">Aplikasi Kegiatan Mencakup Pertanggungjawaban</p>
                    <p className="font-bold text-sm">Balai Besar Pengawas Obat dan Makanan di Mataram</p>
                </div>
            </aside>
        </footer>
    );
}