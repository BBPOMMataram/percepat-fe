import axios from "axios";

const apiBase = axios.create({
  baseURL: "http://localhost/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // untuk kirim cookie
});

export default apiBase;
