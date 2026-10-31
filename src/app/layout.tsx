import '@/lib/legacy-polyfills';
import { Providers } from '@/redux/provider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './percepat-new/globals.css';

import Alert from '@/components/main/Alert';
import Loading from '@/components/main/loading/Loading';

export const metadata = {
  title: {
    template: '%s | BBPOM di Mataram',
    default: 'Home | BBPOM di Mataram'
  },
  description: 'Aplikasi Balai Besar POM di Mataram',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // data-theme nanti buatkan toggle dark mode
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var ua = navigator.userAgent || '';
                  
                  // Deteksi Windows versi lama (Win 7 = NT 6.1, Win 8 = NT 6.2, Win 8.1 = NT 6.3, XP = NT 5.x)
                  var isWin7 = /Windows NT 6\\.1/i.test(ua);
                  var isWin8 = /Windows NT 6\\.[23]/i.test(ua);
                  var isWinXP = /Windows NT 5\\.[12]/i.test(ua);
                  var isLegacyWin = isWin7 || isWin8 || isWinXP;
                  
                  // Deteksi versi Chrome (Chrome 109 adalah versi terakhir di Windows 7 & 8.1)
                  var chromeMatch = ua.match(/Chrome\\/(\\d+)/i);
                  var chromeVer = chromeMatch ? parseInt(chromeMatch[1], 10) : 999;
                  var isLegacyChrome = chromeVer <= 109;

                  // Cek dukungan CSS Modern (OKLCH, Backdrop-filter)
                  var supportsOklch = false;
                  try {
                    supportsOklch = window.CSS && typeof CSS.supports === 'function' && CSS.supports('color', 'oklch(0.5 0.2 180)');
                  } catch(e) {}

                  // Tambahkan class penyesuaian jika terdeteksi Windows lama atau Chrome lama
                  if (isLegacyWin || isLegacyChrome || !supportsOklch) {
                    var html = document.documentElement;
                    html.classList.add('legacy-win');
                    if (isWin7) html.classList.add('legacy-win7');
                    if (isLegacyChrome) html.classList.add('legacy-chrome');
                    html.setAttribute('data-legacy-browser', 'true');
                    html.setAttribute('data-os-detect', isWin7 ? 'windows-7' : (isWin8 ? 'windows-8' : (isLegacyWin ? 'windows-legacy' : 'modern-fallback')));
                  }
                } catch(err) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <Loading />
          <Alert />
          <ToastContainer position="top-right" autoClose={4000} theme="colored" />
          {children}
        </Providers>
      </body>
    </html>
  )
}
