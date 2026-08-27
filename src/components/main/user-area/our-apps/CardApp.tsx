import { AppData } from '@/types/app-data';
import Image from 'next/image';
import Link from 'next/link';

// Palet aksen — dipilih deterministik dari id supaya warna kartu konsisten tiap load
const ACCENTS = [
  { ring: 'hover:border-sky-300', bar: 'from-sky-500 to-cyan-400', soft: 'bg-sky-50', text: 'text-sky-700', btn: 'bg-sky-600 hover:bg-sky-700' },
  { ring: 'hover:border-violet-300', bar: 'from-violet-500 to-fuchsia-400', soft: 'bg-violet-50', text: 'text-violet-700', btn: 'bg-violet-600 hover:bg-violet-700' },
  { ring: 'hover:border-emerald-300', bar: 'from-emerald-500 to-teal-400', soft: 'bg-emerald-50', text: 'text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  { ring: 'hover:border-amber-300', bar: 'from-amber-500 to-orange-400', soft: 'bg-amber-50', text: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' },
  { ring: 'hover:border-rose-300', bar: 'from-rose-500 to-pink-400', soft: 'bg-rose-50', text: 'text-rose-700', btn: 'bg-rose-600 hover:bg-rose-700' },
  { ring: 'hover:border-indigo-300', bar: 'from-indigo-500 to-blue-400', soft: 'bg-indigo-50', text: 'text-indigo-700', btn: 'bg-indigo-600 hover:bg-indigo-700' },
];

const CardApp = ({ appData, isAdmin }: { appData: AppData, isAdmin?: boolean }) => {
  const accent = ACCENTS[(appData?.id ?? 0) % ACCENTS.length];
  const isExternal = appData.link?.includes('http');
  // link internal di DB bisa berbentuk "/percepat" atau "percepat" → normalisasi agar tidak jadi "//" atau "/admin//"
  const slug = (appData.link ?? '').replace(/^\/+/, '');
  const href = isExternal ? appData.link : (isAdmin ? `/admin/${slug}` : `/${slug}`);
  const ctaLabel = isAdmin ? 'Panel Admin' : 'Buka Aplikasi';

  const body = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${accent.ring}`}
    >
      {/* Garis aksen atas */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${accent.bar}`} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Header: logo + nama */}
        <div className="flex items-start gap-3">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${accent.soft} ring-1 ring-inset ring-black/5`}>
            <Image
              className="h-10 w-10 rounded-lg object-contain"
              alt={appData.name}
              width={40}
              height={40}
              src={appData.logo_path && appData.logo_path !== '' ? appData.logo_path : '/assets/images/bpom.webp'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold uppercase leading-snug tracking-wide text-gray-900" title={appData.name}>
              {appData.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {isAdmin && (
                <span className="inline-flex items-center rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Admin
                </span>
              )}
              {isExternal && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                  Eksternal
                </span>
              )}
              {typeof appData.clicks === 'number' && appData.clicks > 0 && (
                <span className={`inline-flex items-center rounded-full ${accent.soft} ${accent.text} px-2 py-0.5 text-[10px] font-semibold`}>
                  {appData.clicks.toLocaleString('id-ID')} kunjungan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Deskripsi */}
        <p className="line-clamp-3 text-sm leading-relaxed text-gray-600" title={appData.desc}>
          {appData.desc && appData.desc !== '-' ? appData.desc : 'Belum ada deskripsi untuk aplikasi ini.'}
        </p>

        {/* PIC / unit penanggung jawab */}
        {appData.pic && appData.pic !== '-' && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate font-medium uppercase tracking-wide">{appData.pic}</span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <span
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl ${accent.btn} px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors`}
          >
            {ctaLabel}
            <svg
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6l6 6-6 6M4 12h15" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 rounded-2xl">
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 rounded-2xl">
      {body}
    </Link>
  );
}

export default CardApp;
