import { createSlice } from "@reduxjs/toolkit";


const initialState = {
    isFormReagenOpen: false
}

export const penerimaanSlice = createSlice({
    name: 'penerimaan',
    initialState,
    reducers: {
        toggleFormReagen: state => {state.isFormReagenOpen = !state.isFormReagenOpen}
    }
})

export const penerimaanActions = penerimaanSlice.actions

export default penerimaanSlice.reducer