import { LoginOrRegisterResponse, LoginPayload, User } from "@/types/auth";
import axios from "@/utils/axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AxiosError } from "axios";

// REGISTER
export const register = createAsyncThunk<LoginOrRegisterResponse, FormData, { rejectValue: string }>(
    "auth/register",
    async (DataFormRegister, thunkAPI) => {
        try {
            const res = await axios.post(
                process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + "/api/register",
                DataFormRegister, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
            );
            return res.data as LoginOrRegisterResponse;
        } catch (error: any) {
            if (error.code === "ERR_NETWORK") {
                return thunkAPI.rejectWithValue("Network Error. Please check your connection.");
            }
            return thunkAPI.rejectWithValue(error.response?.data?.error);
        }
    }
);

// LOGIN
export const login = createAsyncThunk<LoginOrRegisterResponse, LoginPayload, { rejectValue: string }>(
    "auth/login",
    async ({ email, password }, thunkAPI) => {
        try {
            const res = await axios.post(
                process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + "/api/login",
                { email, password },
            );
            return res.data as LoginOrRegisterResponse;
        } catch (error: any) {
            if (error.code === "ERR_NETWORK") {
                return thunkAPI.rejectWithValue("Network Error. Please check your connection.");
            }
            return thunkAPI.rejectWithValue(error.response?.data?.error);
        }
    }
);

// REFRESH TOKEN
export const refreshToken = createAsyncThunk<LoginOrRegisterResponse, void, { rejectValue: string }>(
    "auth/refresh",
    async (_, thunkAPI) => {
        try {
            const res = await axios.post( // biar ga infinite loop jadi ga pake interceptor
                process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + "/api/refresh",
                {},
            );
            return res.data as LoginOrRegisterResponse;
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            return thunkAPI.rejectWithValue(err.response?.data?.message || "Refresh failed");
        }
    }
);

// GET USER (baru)
export const getUser = createAsyncThunk<any, void, { rejectValue: string }>(
    "auth/me",
    async (_, thunkAPI) => {
        try {
            const res = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + "/api/me");
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue("Gagal mengambil data user");
        }
    }
);

interface AuthState {
    loading: boolean;
    error: string | null;
    user: User | null;
}

const initialState: AuthState = {
    loading: false,
    error: null,
    user: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            axios.post(process.env.NEXT_PUBLIC_BACKEND_URL_AUTH + "/api/logout", {})
                .catch(err => console.error(err));
        },
    },
    extraReducers: (builder) => {
        builder
            // REGISTER
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user; // ✅ simpan user
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Unknown error";
            })
            // LOGIN
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user; // ✅ simpan user
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Unknown error";
            })

            // REFRESH TOKEN
            .addCase(refreshToken.fulfilled, () => {
                // token diperbarui, tapi kita tetap bisa fetch user setelah ini
            })

            // GET USER
            .addCase(getUser.fulfilled, (state, action) => {
                state.user = action.payload;
            })
            .addCase(getUser.rejected, (state) => {
                state.user = null;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
