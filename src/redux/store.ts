import { configureStore } from '@reduxjs/toolkit'
import sideBarReducer from '../features/layout/sideBarSlice'
import topBarReducer from '@/features/layout/topBarSlice'
import penerimaanReducer from '@/features/penerimaanSlice'
import permintaanReducer from '@/features/permintaanSlice'
import userReducer from '@/features/userSlice'
import bidangReducer from '@/features/bidangSlice'
import reagenReducer from '@/features/reagenSlice'

export const store = configureStore({
    reducer: {
        sideBar: sideBarReducer,
        topBar: topBarReducer,
        penerimaanReducer,
        permintaanReducer,
        userReducer,
        bidangReducer,
        reagenReducer,
    },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch