import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axios";
import { AxiosError } from "axios";
import { LoginPayload, LoginResponse } from "@/types/auth";

export const login = createAsyncThunk<LoginResponse, LoginPayload, { rejectValue: string }>(
    "auth/login",
    async ({ email, password }, thunkAPI) => {
        try {
            const res = await axios.post("http://localhost:8001/api/login", { email, password });
            return res.data as LoginResponse;
        } catch (error) {
            const err = error as AxiosError<{ error: string }>;

            console.log(err);

            if (err.code === 'ERR_NETWORK') {
                return thunkAPI.rejectWithValue("Network Error. Please check your connection.");
            }

            // if (err.code === 'ERR_BAD_REQUEST') {
            //     return thunkAPI.rejectWithValue("");
            // }

            return thunkAPI.rejectWithValue(
                err.response?.data?.error || "Login failed"
            );
        }
    }
);

export const refreshToken = createAsyncThunk<LoginResponse, void, { rejectValue: string }>(
    "auth/refresh", async (_, thunkAPI) => {
        try {
            const res = await axios.post("http://localhost:8001/api/refresh");
            return res.data;
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            return thunkAPI.rejectWithValue(
                err.response?.data?.message || "Refresh failed"
            );
        }
    });

interface AuthState {
    loading: boolean;
    error: string | null;
    user: any; // Sesuaikan dengan tipe data user yang sebenarnya
}

const initialState: AuthState = {
    loading: false,
    error: null,
    user: null,
}
const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            axios.post("http://localhost:8001/api/logout").catch(err => console.error(err));
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Uknown error";
            })
            .addCase(refreshToken.fulfilled, () => {
                // tidak perlu set state di sini karena token disimpan di cookie
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
