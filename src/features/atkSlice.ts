import axios from "@/config/axios";
import { Dispatch, createSlice } from "@reduxjs/toolkit";

interface ISingleData {
    id: string,
    name: string,
    satuan: string,
    stock: number
}

interface IInitialState {
    isFormOpen:boolean,
    data: ISingleData[],
    singleData: ISingleData | null
}

const initialState: IInitialState = {
    isFormOpen: false,
    data: [],
    singleData: null
}

export const atkSlice = createSlice({
    name: 'atk',
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

export const atkActions = atkSlice.actions

export default atkSlice.reducer

export const fetchData = (url = '/api/barang-atk?value_per_page=5') => {
    return async (dispatch: Dispatch) => {
        axios(url)
            .then(({ data }) => {
                dispatch(atkActions.setData(data));
            })
            .catch(err => console.log(err))
    }
}

export const fetchSingleData = (id: string) => {
    return async (dispatch: Dispatch) => {
        id &&
            axios(`/api/barang-atk/${id}`)
                .then(({ data }) => {
                    dispatch(atkActions.setSingleData(data.data));
                })
                .catch(err => console.log(err))
    }
}
