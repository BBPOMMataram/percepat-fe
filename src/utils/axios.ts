import axios from "axios";
import Cookies from "js-cookie";

const isProduction = process.env.NODE_ENV === "production";

// Jika berjalan di server produksi, abaikan nilai .env dan paksa gunakan URL asli
const targetBaseURL = isProduction 
    ? "https://e-sapa.bbpommataram.id" // Pastikan ini adalah URL backend E-Sapa yang benar
    : process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA;

const apiBase = axios.create({
  baseURL: targetBaseURL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

apiBase.interceptors.request.use(config => {
  const token = Cookies.get('XSRF-TOKEN');
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

export default apiBase;