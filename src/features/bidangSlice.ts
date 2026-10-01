import apiBase from "@/utils/axios";
import { Dispatch, createSlice } from "@reduxjs/toolkit";

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
        apiBase(url)
            .then(({ data }) => {
                dispatch(bidangActions.setDataBidang(data));
            })
            .catch(err => console.log(err))
    }
}

export const fetchSingleData = (id: string) => {
    return async (dispatch: Dispatch) => {

        id &&
            apiBase(`/api/bidang/${id}`)
                .then(({ data }) => {
                    dispatch(bidangActions.setData(data.data));
                })
                .catch(err => console.log(err))
    }
}
