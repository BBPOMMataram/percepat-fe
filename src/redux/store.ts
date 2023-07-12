import { configureStore } from '@reduxjs/toolkit'
import sideBarReducer from '../features/layout/sideBarSlice'
import topBarReducer from '@/features/layout/topBarSlice'

export const store = configureStore({
    reducer: {
        sideBar: sideBarReducer,
        topBar: topBarReducer
    },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch