import axios from "axios";

const isProduction = process.env.NODE_ENV === "production";

const targetBaseURL = isProduction 
  ? "https://e-sapa.bbpommataram.id" 
  : process.env.NEXT_PUBLIC_BACKEND_URL_ESAPA;

const apiBase = axios.create({
  baseURL: targetBaseURL,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // untuk kirim cookie
});

export default apiBase;