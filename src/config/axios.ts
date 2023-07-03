import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    // withCredentials: false
});

// axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
export default axiosInstance