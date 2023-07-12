import { createSlice } from '@reduxjs/toolkit'

export interface sideBarState {
    isSideBarOpen: boolean
}

const initialState: sideBarState = {
    isSideBarOpen: true
}

export const sideBarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        toggleSideBar: (state) => {
            state.isSideBarOpen = !state.isSideBarOpen
        }
    },
})

// Action creators are generated for each case reducer function
export const { toggleSideBar } = sideBarSlice.actions

export default sideBarSlice.reducer