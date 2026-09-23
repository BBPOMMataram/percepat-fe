export default function SiprovalPage() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>

        <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Sistem Informasi Program dan Evaluasi
        </span>

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
          SIPROVAL <span className="text-emerald-600">BBPOM</span> di Mataram
        </h1>

        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
          Portal terpadu untuk monitoring, evaluasi, dan pelaporan kinerja Balai Besar POM di Mataram. Akses seluruh fitur dengan satu akun.
        </p>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Menu Utama
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: 'clipboard-list', label: 'Perencanaan' },
              { icon: 'wallet', label: 'Penganggaran' },
              { icon: 'desktop', label: 'Monitoring' },
              { icon: 'file-alt', label: 'Laporan Kinerja' },
              { icon: 'user', label: 'Profil' },
            ].map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-gray-700 font-semibold text-sm transition-all hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm border border-transparent hover:border-emerald-200"
                onClick={() => window.alert(`Menu ${item.label} akan segera tersedia`)}
              >
                <span className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`fas fa-${item.icon} text-white text-sm`} />
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          &copy; 2026 BBPOM di Mataram &mdash; Dilindungi oleh autentikasi
        </p>
      </div>
    </section>
  );
}
