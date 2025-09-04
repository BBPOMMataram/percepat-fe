// src/redux/features/alertSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AlertType = "success" | "error";

interface AlertState {
  type: AlertType | null;
  message: string | null;
  description: string | null;
}

const initialState: AlertState = {
  type: null,
  message: null,
  description: null,
};

const alertSlice = createSlice({
  name: "alert",
  initialState,
  reducers: {
    showAlert: (
      state,
      action: PayloadAction<{ type: AlertType; message: string; description: string }>
    ) => {
      state.type = action.payload.type;
      state.message = action.payload.message;
      state.description = action.payload.description;
    },
    clearAlert: (state) => {
      state.type = null;
      state.message = null;
      state.description = null;
    },
  },
});

export const { showAlert, clearAlert } = alertSlice.actions;
export default alertSlice.reducer;
