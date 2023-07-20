import axios from "@/config/axios";
import { Dispatch, createSlice } from "@reduxjs/toolkit";

const initialState = {
    isFormReagenOpen: false,
    dataReagen: <any>[],
    dataAtk: <any>[],
}

export const penerimaanSlice = createSlice({
    name: 'penerimaan',
    initialState,
    reducers: {
        toggleFormReagen: state => { state.isFormReagenOpen = !state.isFormReagenOpen },
        setDataReagen: (state, { payload }) => {
            state.dataReagen = payload
        },
        setDataAtk: (state, { payload }) => {
            state.dataAtk = payload
        },
    }
})

export const penerimaanActions = penerimaanSlice.actions

export default penerimaanSlice.reducer

export const fetchDataReagen = (url = '/api/penerimaan-reagen?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(penerimaanActions.setDataReagen(data));
            })
            .catch(err => console.log(err))
    }
}

export const fetchDataAtk = (url = '/api/penerimaan-atk?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(penerimaanActions.setDataAtk(data));
            })
            .catch(err => console.log(err))
    }
}