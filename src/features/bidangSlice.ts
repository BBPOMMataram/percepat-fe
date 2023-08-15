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

const initialState: { isFormOpen: boolean , data: any, singleData: any } = {
    isFormOpen: false,
    data: null,
    singleData: null
}

export const bidangSlice = createSlice({
    name: 'bidang',
    initialState,
    reducers: {
        toggleForm: state => { state.isFormOpen = !state.isFormOpen },
        setDataBidang: (state, { payload }) => {
            state.data = payload
        },
        setData: (state, { payload }) => {
            state.singleData = payload
        },
    }
})

export const bidangActions = bidangSlice.actions

export default bidangSlice.reducer

export const fetchData = (url = '/api/bidang?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(bidangActions.setDataBidang(data));
            })
            .catch(err => console.log(err))
    }
}

export const fetchSingleData = (id: string) => {
    return async (dispatch: Dispatch) => {

        id &&
            axios(`/api/bidang/${id}`)
                .then(({ data }) => {
                    dispatch(bidangActions.setData(data.data));
                })
                .catch(err => console.log(err))
    }
}
