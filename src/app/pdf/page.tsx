import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Sparkles } from "lucide-react";

export default function PdfToolsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Kembali ke beranda">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white">
              <FileText size={21} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight text-slate-900">PDF Tools</span>
              <span className="block text-xs text-slate-500">BBPOM di Mataram</span>
            </span>
          </Link>
          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
            <ShieldCheck size={15} aria-hidden="true" />
            Praktis dan mudah digunakan
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-blue-100 bg-white">
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-blue-900">
            <Sparkles size={14} aria-hidden="true" />
            Utilitas PDF
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Kelola dokumen PDF dengan lebih mudah.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Pilih alat PDF yang Anda perlukan. Kami mulai dengan alat kompresi untuk membantu mengecilkan ukuran dokumen.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-800">Pilih alat</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Alat PDF</h2>
          </div>
          <span className="rounded-full bg-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-600">1 alat tersedia</span>
        </div>

        <Link
          href="/pdf/compress"
          className="group relative flex min-h-64 max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-blue-50 transition-transform duration-300 group-hover:scale-125" />
          <div className="relative flex items-start justify-between">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-lg shadow-blue-900/20">
              <FileText size={27} aria-hidden="true" />
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">PDF</span>
          </div>
          <div className="relative mt-8">
            <h3 className="text-xl font-bold text-slate-900">Kompres PDF</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
              Kurangi ukuran file PDF agar lebih mudah disimpan dan dibagikan.
            </p>
          </div>
          <span className="relative mt-auto flex items-center gap-2 pt-7 text-sm font-bold text-blue-900">
            Buka alat
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </Link>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-slate-500 sm:px-8">
          BBPOM di Mataram
        </div>
      </footer>
    </main>
  );
}
