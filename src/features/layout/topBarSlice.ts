import { createSlice } from '@reduxjs/toolkit'

export interface topBarState {
    isUserMenuOpen: boolean
}

const initialState: topBarState = {
    isUserMenuOpen: false
}

export const topBarSlice = createSlice({
    name: 'topbar',
    initialState,
    reducers: {
        toggleUserMenu: (state) => {
            state.isUserMenuOpen = !state.isUserMenuOpen
        }
    },
})

// Action creators are generated for each case reducer function
export const { toggleUserMenu } = topBarSlice.actions

export default topBarSlice.reducer