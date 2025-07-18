import axios from "@/config/axios";
import { Dispatch, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const initialState = {
  isFormOpen: false,
  dataReagen: <any>[],
  dataAtk: <any>[],
  listInventory: <any>[],
  isViewMode: false,
  isEditMode: false,
  currentDataId: null, // untuk ambil data tgl permintaan di form list permintaan
};

export const permintaanSlice = createSlice({
  name: "permintaan",
  initialState,
  reducers: {
    toggleForm: (state) => {
      state.isFormOpen = !state.isFormOpen;
    },
    setDataReagen: (state, { payload }) => {
      state.dataReagen = payload;
    },
    clearDataReagen: (state) => {
      state.dataReagen = [];
    },
    setDataAtk: (state, { payload }) => {
      state.dataAtk = payload;
    },
    setListInventory: (state, { payload }) => {
      state.listInventory = payload;
    },
    setIsViewMode: (state, { payload }) => {
      state.isViewMode = payload;
    },
    setIsEditMode: (state, { payload }) => {
      state.isEditMode = payload;
    },
    clearList: (state) => {
      state.listInventory = [];
    },
    addList: (state, { payload }) => {
      const existingItem = state.listInventory.find(
        (item: any) => (item.barang?.id || item.atk.id) === payload.barang.id,
      );
      if (existingItem) {
        existingItem.jumlahpermintaan =
          +existingItem.jumlahpermintaan + +payload.jumlahpermintaan;
        existingItem.keterangan = payload.keterangan;
      } else {
        state.listInventory.push(payload);
      }
    },
    substractList: (state, { payload }) => {
      state.listInventory = state.listInventory.filter(
        (item: any) => (item.barang?.id || item.atk.id) !== +payload,
      );
    },
    setCurrentDataId: (state, { payload }) => {
      state.currentDataId = payload;
    },
  },
});

export const permintaanActions = permintaanSlice.actions;

export default permintaanSlice.reducer;

export const fetchDataReagen = (
  url = "/api/permintaan-reagen?value_per_page=5",
) => {
  return async (dispatch: Dispatch) => {
    axios(url)
      .then(({ data }) => {
        dispatch(permintaanActions.setDataReagen(data));
      })
      .catch((err) => console.log(err));
  };
};

export const fetchDataAtk = (url = "/api/permintaan-atk?value_per_page=5") => {
  return async (dispatch: Dispatch) => {
    axios(url)
      .then(({ data }) => {
        dispatch(permintaanActions.setDataAtk(data));
      })
      .catch((err) => console.log(err));
  };
};

export const fetchListInventoryReagen = (idPermintaan: string) => {
  return async (dispatch: Dispatch) => {
    axios(`/api/list-permintaan-reagen/${idPermintaan}`)
      .then(({ data }) => {
        dispatch(permintaanActions.setListInventory(data.data));
      })
      .catch((err) => console.log(err));
  };
};

export const fetchListInventory = (idPermintaan: string) => {
  return async (dispatch: Dispatch) => {
    axios(`/api/list-permintaan-atk/${idPermintaan}`)
      .then(({ data }) => {
        dispatch(permintaanActions.setListInventory(data.data));
      })
      .catch((err) => console.log(err));
  };
};

export const removeData = (idPermintaan: string) => {
  return async (dispatch: Dispatch) => {
    axios
      .delete(`/api/permintaan-reagen/${idPermintaan}`)
      .then(({ data }) => {
        toast.success(data.msg, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      })
      .catch((err) => console.log(err));
  };
};
