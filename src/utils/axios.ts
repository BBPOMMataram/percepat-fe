import axios from "axios";

const apiBase = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // untuk kirim cookie
});

export default apiBase;
