import axios from "axios";

const apiBase = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_PERCEPAT,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // untuk kirim cookie
});

export default apiBase;
