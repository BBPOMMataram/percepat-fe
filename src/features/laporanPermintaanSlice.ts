import axios from "@/config/axios";
import { Dispatch, createSlice } from "@reduxjs/toolkit";

const initialState = {
    dataReagen: <any>[],
    dataAtk: <any>[],
    currentDataId: null, //UNTUK JADI KONDISI DI LOADING ICON
    url: "", //url untuk download
}

export const laporanPermintaanSlice = createSlice({
    name: 'laporan-permintaan',
    initialState,
    reducers: {
        setDataReagen: (state, { payload }) => {
            state.dataReagen = payload
        },
        setDataAtk: (state, { payload }) => {
            state.dataAtk = payload
        },
        setCurrentDataId: (state, { payload }) => { state.currentDataId = payload },
        setUrl: (state, { payload }) => { state.url = payload },
    }
})

export const laporanPermintaanActions = laporanPermintaanSlice.actions

export default laporanPermintaanSlice.reducer

export const fetchDataReagen = (url: string) => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(laporanPermintaanActions.setDataReagen(data));
            })
            .catch(err => console.log(err))
    }
}

export const fetchDataAtk = (url: string) => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(laporanPermintaanActions.setDataAtk(data));
            })
            .catch(err => console.log(err))
    }
}