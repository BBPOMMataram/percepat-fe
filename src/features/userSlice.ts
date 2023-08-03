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
        last_page:number,
        total: number
    }
}

interface IUserWithLimit {
    data: IUser[]
}

const initialState: { isFormOpen: boolean, dataUser: IUserResponse | IUserWithLimit | null } = {
    isFormOpen: false,
    dataUser: null,
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        toggleForm: state => { state.isFormOpen = !state.isFormOpen },
        setDataUser: (state, { payload }) => {
            state.dataUser = payload
        },
    }
})

export const userActions = userSlice.actions

export default userSlice.reducer

export const fetchDataUser = (url = '/api/users?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(userActions.setDataUser(data));
            })
            .catch(err => console.log(err))
    }
}