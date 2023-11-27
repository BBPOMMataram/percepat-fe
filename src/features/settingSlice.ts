import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isLoading: false,
}

export const settingSlice = createSlice({
    name: 'setting',
    initialState,
    reducers: {
        setIsLoading: (state, {payload}) => { state.isLoading = payload },
    }
})

export const settingActions = settingSlice.actions

export default settingSlice.reducer
