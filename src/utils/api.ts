// src/utils/api.ts
import { logout, refreshToken } from "@/features/authSlice";
import { store } from "@/redux/store";
import apiBase from "./axios";

const api = apiBase;

// request interceptor (gak perlu token lagi)
api.interceptors.request.use((config) => config);

// response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await store.dispatch(refreshToken()).unwrap();
        return api(error.config);
      } catch {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
