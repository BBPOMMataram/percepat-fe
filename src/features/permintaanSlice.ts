import axios from "@/config/axios";
import { Dispatch, createSlice } from "@reduxjs/toolkit";

const initialState = {
    isFormOpen: false,
    dataReagen: <any>[],
    dataAtk: <any>[],
}

export const permintaanSlice = createSlice({
    name: 'permintaan',
    initialState,
    reducers: {
        toggleForm: state => { state.isFormOpen = !state.isFormOpen },
        setDataReagen: (state, { payload }) => {
            state.dataReagen = payload
        },
        setDataAtk: (state, { payload }) => {
            state.dataAtk = payload
        },
    }
})

export const permintaanActions = permintaanSlice.actions

export default permintaanSlice.reducer

export const fetchDataReagen = (url = '/api/permintaan-reagen?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(permintaanActions.setDataReagen(data));
            })
            .catch(err => console.log(err))
    }
}

export const fetchDataAtk = (url = '/api/permintaan-atk?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(permintaanActions.setDataAtk(data));
            })
            .catch(err => console.log(err))
    }
}