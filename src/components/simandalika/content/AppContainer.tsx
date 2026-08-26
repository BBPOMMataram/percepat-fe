import { AppData } from '@/types/app-data';
import Image from 'next/image';
import Link from 'next/link';

const AppContainer = ({ appData }: { appData: AppData }) => {
    const isExternal = appData.link?.includes('http');
    // link internal di DB bisa "/percepat" atau "percepat" → normalisasi supaya tidak jadi "//"
    const slug = (appData.link ?? '').replace(/^\/+/, '');
    const href = isExternal ? appData.link : `/${slug}`;
    const hasDesc = appData.desc && appData.desc !== '-';

    const body = (
        <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-bpom-green/40 hover:shadow-2xl">
            {/* Garis aksen atas */}
            <div className="h-1.5 w-full bg-gradient-to-r from-bpom-green via-emerald-400 to-teal-400" />

            <div className="flex flex-1 flex-col gap-3 p-6">
                {/* Logo + nama */}
                <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-inset ring-bpom-green/15 transition-transform duration-300 group-hover:scale-105">
                        <Image
                            className="h-11 w-11 rounded-lg object-contain"
                            alt={appData.name}
                            width={44}
                            height={44}
                            src={appData.logo_path ?? '/assets/images/noimage.svg'}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3
                            className="text-lg font-extrabold uppercase leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-bpom-green"
                            title={appData.name}
                        >
                            {appData.name}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {appData.pic && appData.pic !== '-' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {appData.pic}
                                </span>
                            )}
                            {isExternal && (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    Eksternal
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Deskripsi */}
                <p
                    className={`line-clamp-3 text-sm leading-relaxed ${hasDesc ? 'text-gray-600' : 'italic text-gray-400'}`}
                    title={hasDesc ? appData.desc : undefined}
                >
                    {hasDesc ? appData.desc : 'Belum ada deskripsi untuk aplikasi ini.'}
                </p>

                {/* Footer: kunjungan + CTA */}
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    {typeof appData.clicks === 'number' && appData.clicks > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1 1 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {appData.clicks.toLocaleString('id-ID')} kunjungan
                        </span>
                    ) : <span />}

                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bpom-green px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition-colors group-hover:bg-emerald-700">
                        Kunjungi
                        <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6l6 6-6 6M4 12h15" />
                        </svg>
                    </span>
                </div>
            </div>
        </div>
    );

    if (isExternal) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Kunjungi ${appData.name}`}
                className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-bpom-green focus-visible:ring-offset-2"
            >
                {body}
            </a>
        );
    }

    return (
        <Link
            href={href}
            aria-label={`Kunjungi ${appData.name}`}
            className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-bpom-green focus-visible:ring-offset-2"
        >
            {body}
        </Link>
    );
}

export default AppContainer
