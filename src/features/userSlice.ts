import axios from "@/config/axios";
import { Dispatch, createSlice } from "@reduxjs/toolkit";

interface IUser {
    id: number,
    name: string,
    email: string,
    photo: string,
    signature: string,
    position: string,
    bidang: {
        id: string,
        name: string,
        kabid: string
    }
}

interface IUserResponse {
    data: IUser[],
    links: {},
    meta: {
        current_page: number,
        links: [],
        last_page: number,
        total: number
    }
}

interface IUserWithLimit {
    data: IUser[]
}

const initialState: { isFormOpen: boolean, dataUser: IUserResponse | IUserWithLimit | null, data: IUser | null } = {
    isFormOpen: false,
    dataUser: null,
    data: null, //for single data
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        toggleForm: state => { state.isFormOpen = !state.isFormOpen },
        setDataUsers: (state, { payload }) => {
            state.dataUser = payload
        },
        setData: (state, { payload }) => {
            state.data = payload
        },
    }
})

export const userActions = userSlice.actions

export default userSlice.reducer

export const fetchUsers = (url = '/api/users?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(userActions.setDataUsers(data));
            })
            .catch(err => console.log(err))
    }
}

export const fetchUser = (id: string) => {
    return async (dispatch: Dispatch) => {

        id &&
            axios(`/api/users/${id}`)
                .then(({ data }) => {
                    dispatch(userActions.setData(data.data));
                })
                .catch(err => console.log(err))
    }
}
