// src/utils/api.ts
import { logout, refreshToken } from "@/features/authSlice";
import { store } from "@/redux/store";
import apiBase from "./axios";

const api = apiBase;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jangan refresh jika error datang dari /api/refresh atau /api/logout
    if (
      error.response?.status === 401 &&
      !originalRequest._retry && // untuk mencegah infinite loop
      !originalRequest.url.includes("/api/refresh") &&
      !originalRequest.url.includes("/api/logout")
    ) {
      originalRequest._retry = true;
      try {
        await store.dispatch(refreshToken()).unwrap();
        return api(originalRequest);
      } catch {
        // hanya logout kalau refresh token gagal *dan* user masih login
        const { user } = store.getState().auth;
        if (user) store.dispatch(logout());
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);


export default api;
