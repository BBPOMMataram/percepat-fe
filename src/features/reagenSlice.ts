import axios from "@/config/axios";
import { Dispatch, createSlice } from "@reduxjs/toolkit";

const initialState: { isFormOpen: boolean , data: any, singleData: any } = {
    isFormOpen: false,
    data: null,
    singleData: null
}

export const reagenSlice = createSlice({
    name: 'reagen',
    initialState,
    reducers: {
        toggleForm: state => { state.isFormOpen = !state.isFormOpen },
        setData: (state, { payload }) => {
            state.data = payload
        },
        setSingleData: (state, { payload }) => {
            state.singleData = payload
        },
    }
})

export const reagenActions = reagenSlice.actions

export default reagenSlice.reducer

export const fetchData = (url = '/api/barang-reagen?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(reagenActions.setData(data));
            })
            .catch(err => console.log(err))
    }
}

export const fetchSingleData = (id: string) => {
    return async (dispatch: Dispatch) => {

        id &&
            axios(`/api/barang-reagen/${id}`)
                .then(({ data }) => {
                    dispatch(reagenActions.setSingleData(data.data));
                })
                .catch(err => console.log(err))
    }
}
